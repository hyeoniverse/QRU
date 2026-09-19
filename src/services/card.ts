import {
  QueryConstraint,
  Timestamp,
  WithFieldValue,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
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
  ShuffleFilters,
  createSerialNumber,
  createShuffleMeta,
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

  // createdAt 은 서버가 찍는다. 규칙에서 request.time 과 같은지 확인하므로
  // 클라이언트가 임의의 시각을 넣을 수 없다.
  const publicCard: WithFieldValue<PublicCard> = {
    serialNumber,
    uid: input.uid,
    createdAt: serverTimestamp(),
    entries: toCardEntries(input.values, input.isPublic),
    shuffle: createShuffleMeta(input.values, input.isPublic, input.inShuffle),
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
  shuffle: {
    enabled: data.shuffle?.enabled ?? false,
    key: data.shuffle?.key ?? 0,
    gender: data.shuffle?.gender ?? null,
    mbti: data.shuffle?.mbti ?? null,
  },
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

/** 셔플 결과에 쓸 수 있는 최대 개수 (규칙의 request.query.limit 과 맞춘다) */
const SHUFFLE_QUERY_LIMIT = 1;

/**
 * 난수 key 를 기준으로 한 장을 고른다.
 *
 * Firestore 에는 무작위 추출이 없어서, 문서마다 0~1 난수를 저장해 두고
 * "그 값 이상인 첫 문서" 를 가져온다. 없으면 반대 방향으로 한 번 더 찾아
 * 끝에서 처음으로 돌아온다.
 */
const pickByShuffleKey = async (
  collectionName: string,
  filters: ShuffleFilters,
  key: number
): Promise<CardDocument | null> => {
  const db = requireDb();

  const conditions: QueryConstraint[] = [where("shuffle.enabled", "==", true)];
  if (filters.gender) conditions.push(where("shuffle.gender", "==", filters.gender));
  if (filters.mbti) conditions.push(where("shuffle.mbti", "==", filters.mbti));

  for (const direction of ["asc", "desc"] as const) {
    const snapshot = await getDocs(
      query(
        collection(db, collectionName),
        ...conditions,
        direction === "asc"
          ? where("shuffle.key", ">=", key)
          : where("shuffle.key", "<", key),
        orderBy("shuffle.key", direction),
        limit(SHUFFLE_QUERY_LIMIT)
      )
    );

    const [found] = snapshot.docs;
    if (found) return toCardDocument(found.id, found.data() as Partial<PublicCard>);
  }

  return null;
};

/**
 * 조건에 맞는 명함 한 장을 무작위로 가져온다.
 * 직전에 본 명함(exclude)은 되도록 피하지만, 그것밖에 없으면 그대로 돌려준다.
 */
export const fetchRandomCard = async (
  filters: ShuffleFilters = {},
  exclude?: string
): Promise<CardDocument | null> => {
  const key = Math.random();

  // 회원/비회원 컬렉션이 분리되어 있어 양쪽에서 뽑고 그중 하나를 고른다. (#32)
  const picked = await Promise.all(
    Object.values(CARD_COLLECTION).map((name) => pickByShuffleKey(name, filters, key))
  );

  const candidates = picked.filter((card): card is CardDocument => card !== null);
  if (candidates.length === 0) return null;

  const fresh = candidates.filter((card) => card.id !== exclude);
  const pool = fresh.length > 0 ? fresh : candidates;

  return pool[Math.floor(Math.random() * pool.length)];
};
