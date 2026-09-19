import {
  QueryConstraint,
  Timestamp,
  WithFieldValue,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { requireDb } from "./firebase";
import {
  CARD_COLLECTION,
  CardDocument,
  NewCard,
  PRIVATE_CARD_PATH,
  PrivateCard,
  PublicCard,
} from "../types/cardType";
import {
  CardEntry,
  createSearchIndex,
  createSerialNumber,
  matchesSearchText,
  normalizeSearchValue,
  toCardEntries,
} from "../utils/cardUtil";

/**
 * 명함을 저장한다.
 *
 * 공개 문서에는 "공개"로 설정한 항목만 넣고, 입력 원본과 비밀번호는
 * 따로 잠긴 하위 문서에 둔다. 공개 문서를 통째로 읽어도 비공개 항목이
 * 새어나가지 않게 하기 위함이다.
 */
export const createCard = async (
  input: NewCard
): Promise<{ id: string; serialNumber: string }> => {
  const db = requireDb();
  const collectionName = input.uid
    ? CARD_COLLECTION.member
    : CARD_COLLECTION.guest;

  const cardRef = doc(collection(db, collectionName));
  const serialNumber = createSerialNumber();
  const entries: CardEntry[] = toCardEntries(input.values, input.isPublic);

  // createdAt 은 서버가 찍는다. 규칙에서 request.time 과 같은지 확인하므로
  // 클라이언트가 임의의 시각을 넣을 수 없다.
  const publicCard: WithFieldValue<PublicCard> = {
    serialNumber,
    uid: input.uid,
    createdAt: serverTimestamp(),
    entries,
    inShuffle: input.inShuffle,
    search: createSearchIndex(entries),
  };

  const privateCard: PrivateCard = {
    uid: input.uid,
    values: input.values,
    isPublic: input.isPublic,
    ...(input.password ? { password: input.password } : {}),
  };

  // 둘 중 하나만 저장되는 일이 없도록 한 번에 쓴다.
  const batch = writeBatch(db);
  batch.set(cardRef, publicCard);
  batch.set(doc(cardRef, ...PRIVATE_CARD_PATH), privateCard);
  await batch.commit();

  return { id: cardRef.id, serialNumber };
};

/**
 * createdAt 을 Date 로 바꾼다.
 * 서버 시각을 쓰기 전에 ISO 문자열로 저장된 문서도 함께 받아준다.
 */
const toDate = (value: unknown): Date | null => {
  if (value instanceof Timestamp) return value.toDate();

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

/**
 * 저장된 문서를 화면에서 쓰는 형태로 바꾼다.
 *
 * 지금 형식을 쓰기 전에 저장된 문서가 남아 있을 수 있어,
 * 빠진 값은 빈 값으로 채워 화면이 깨지지 않게 한다.
 */
const toCardDocument = (
  id: string,
  data: Partial<PublicCard>
): CardDocument => ({
  id,
  serialNumber: data.serialNumber ?? "",
  uid: data.uid ?? null,
  createdAt: toDate(data.createdAt),
  entries: Array.isArray(data.entries) ? data.entries : [],
  inShuffle: data.inShuffle ?? false,
  search: data.search ?? {},
});

/** 문서 id 로 공개 명함을 읽는다. 없으면 null */
export const getCard = async (id: string): Promise<CardDocument | null> => {
  const db = requireDb();

  // 회원/비회원 컬렉션이 분리되어 있어 양쪽을 확인한다. (#32)
  for (const collectionName of Object.values(CARD_COLLECTION)) {
    const snapshot = await getDoc(doc(db, collectionName, id));

    if (snapshot.exists()) {
      return toCardDocument(snapshot.id, snapshot.data() as Partial<PublicCard>);
    }
  }

  return null;
};


/**
 * 한 번에 가져오는 후보 수.
 *
 * 조건에 맞는 명함이 이보다 많으면 앞의 일부만 후보가 된다.
 * 규칙의 request.query.limit 과 같은 값이어야 한다.
 */
export const CANDIDATE_LIMIT = 50;

export type CardSearchCriteria = {
  /** 항목 id -> 정확히 일치해야 하는 값 */
  filters?: Record<string, string>;
  /** 아무 항목에나 부분 일치하면 되는 검색어 */
  text?: string;
};

/**
 * 조건에 맞는 셔플 대상 명함을 모은다.
 *
 * Firestore 에는 "같음" 조건만 넘긴다. 등식만 쓰면 단일 필드 색인을
 * 합쳐서 처리하므로 조건을 몇 개 조합하든 복합 색인이 필요 없다.
 * 부분 일치는 Firestore 가 못 하므로 받아온 후보 안에서 걸러낸다.
 */
export const searchCards = async (
  criteria: CardSearchCriteria = {}
): Promise<CardDocument[]> => {
  const db = requireDb();

  const conditions: QueryConstraint[] = [where("inShuffle", "==", true)];
  for (const [id, value] of Object.entries(criteria.filters ?? {})) {
    if (value) conditions.push(where(`search.${id}`, "==", normalizeSearchValue(value)));
  }

  const results = await Promise.all(
    Object.values(CARD_COLLECTION).map((name) =>
      getDocs(query(collection(db, name), ...conditions, limit(CANDIDATE_LIMIT)))
    )
  );

  return results
    .flatMap((snapshot) => snapshot.docs)
    .map((found) => toCardDocument(found.id, found.data() as Partial<PublicCard>))
    .filter((card) => matchesSearchText(card.entries, criteria.text ?? ""));
};

/**
 * 조건에 맞는 명함 한 장을 무작위로 고른다.
 * 직전에 본 명함(exclude)은 되도록 피하지만, 그것밖에 없으면 그대로 돌려준다.
 */
export const fetchRandomCard = async (
  criteria: CardSearchCriteria = {},
  exclude?: string
): Promise<CardDocument | null> => {
  const candidates = await searchCards(criteria);
  if (candidates.length === 0) return null;

  const fresh = candidates.filter((card) => card.id !== exclude);
  const pool = fresh.length > 0 ? fresh : candidates;

  return pool[Math.floor(Math.random() * pool.length)];
};
