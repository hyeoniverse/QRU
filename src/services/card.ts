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
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { requireDb } from "./firebase";
import {
  CARD_COLLECTION,
  CardCollection,
  CardDocument,
  CardPhoto,
  CardUpdate,
  NewCard,
  PHOTO_PATH,
  PRIVATE_CARD_PATH,
  PrivateCard,
  PublicCard,
  SERIAL_COLLECTION,
  SerialPointer,
} from "../types/cardType";
import {
  CardEntry,
  createSearchIndex,
  createSerialNumber,
  matchesSearchText,
  normalizeSearchValue,
  normalizeSerial,
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
    hasPhoto: Boolean(input.photo),
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
  if (input.photo) {
    batch.set(doc(cardRef, ...PHOTO_PATH), {
      uid: input.uid,
      dataUrl: input.photo,
    } satisfies CardPhoto);
  }
  await batch.commit();

  // 길잡이는 명함이 생긴 뒤에 쓴다. 규칙이 명함을 읽어 확인하므로
  // 같은 배치에 넣으면 그 시점에 명함이 아직 없어 거부된다.
  await ensureSerialPointer({
    id: cardRef.id,
    collection: collectionName,
    serialNumber,
    uid: input.uid,
  });

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
  collectionName: CardCollection,
  data: Partial<PublicCard>
): CardDocument => ({
  id,
  collection: collectionName,
  serialNumber: data.serialNumber ?? "",
  uid: data.uid ?? null,
  createdAt: toDate(data.createdAt),
  entries: Array.isArray(data.entries) ? data.entries : [],
  inShuffle: data.inShuffle ?? false,
  search: data.search ?? {},
  hasPhoto: data.hasPhoto ?? false,
});

/** 문서 id 로 공개 명함을 읽는다. 없으면 null */
export const getCard = async (id: string): Promise<CardDocument | null> => {
  const db = requireDb();

  // 회원/비회원 컬렉션이 분리되어 있어 양쪽을 확인한다. (#32)
  for (const collectionName of Object.values(CARD_COLLECTION)) {
    const snapshot = await getDoc(doc(db, collectionName, id));

    if (snapshot.exists()) {
      return toCardDocument(
        snapshot.id,
        collectionName,
        snapshot.data() as Partial<PublicCard>
      );
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
    .flatMap((snapshot, index) =>
      snapshot.docs.map((found) =>
        toCardDocument(
          found.id,
          Object.values(CARD_COLLECTION)[index],
          found.data() as Partial<PublicCard>
        )
      )
    )
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

/**
 * 명함 사진을 읽는다. 없으면 null
 *
 * 명함 문서와 따로 두었기 때문에 한 장을 화면에 띄울 때만 부른다.
 */
export const getCardPhoto = async (card: CardDocument): Promise<string | null> => {
  if (!card.hasPhoto) return null;

  const snapshot = await getDoc(
    doc(requireDb(), card.collection, card.id, ...PHOTO_PATH)
  );
  if (!snapshot.exists()) return null;

  const { dataUrl } = snapshot.data() as Partial<CardPhoto>;
  return typeof dataUrl === "string" && dataUrl ? dataUrl : null;
};

/**
 * 로그인한 사용자가 만든 명함을 모두 가져온다.
 *
 * 규칙이 resource.data.uid 를 보기 때문에 질의에도 같은 조건이 있어야
 * 한다. 조건이 없으면 Firestore 가 질의 자체를 거부한다.
 *
 * 정렬은 화면에서 한다. uid 로 거르면서 createdAt 으로 정렬하면
 * 복합 색인이 필요해지는데, 한 사람의 명함은 많지 않아 그만한 값이 없다.
 */
export const listMyCards = async (uid: string): Promise<CardDocument[]> => {
  const snapshot = await getDocs(
    query(
      collection(requireDb(), CARD_COLLECTION.member),
      where("uid", "==", uid)
    )
  );

  return snapshot.docs
    .map((found) =>
      toCardDocument(
        found.id,
        CARD_COLLECTION.member,
        found.data() as Partial<PublicCard>
      )
    )
    .sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
};

/** 수정 화면을 채우기 위해 입력 원본을 읽는다. 소유자만 읽을 수 있다. */
export const getPrivateCard = async (
  card: CardDocument
): Promise<PrivateCard | null> => {
  const snapshot = await getDoc(
    doc(requireDb(), card.collection, card.id, ...PRIVATE_CARD_PATH)
  );
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Partial<PrivateCard>;

  return {
    uid: data.uid ?? null,
    values: data.values ?? {},
    isPublic: data.isPublic ?? {},
  };
};

/**
 * 명함을 수정한다.
 *
 * 공개 문서는 바뀌는 필드만 건드린다. createdAt 은 서버가 찍은
 * Timestamp 라 Date 로 바꿨다가 되돌리면 나노초가 잘려 규칙의
 * "그대로인지" 검사를 통과하지 못한다. 아예 손대지 않는 편이 안전하다.
 */
export const updateCard = async (
  card: CardDocument,
  input: CardUpdate
): Promise<void> => {
  const db = requireDb();
  const cardRef = doc(db, card.collection, card.id);
  const entries: CardEntry[] = toCardEntries(input.values, input.isPublic);

  const batch = writeBatch(db);

  batch.update(cardRef, {
    entries,
    search: createSearchIndex(entries),
    inShuffle: input.inShuffle,
    hasPhoto: input.photo !== null,
  });

  // 비밀번호는 비회원만 갖는데 수정은 회원만 할 수 있다. 그래서 통째로 쓴다.
  batch.set(doc(cardRef, ...PRIVATE_CARD_PATH), {
    uid: card.uid,
    values: input.values,
    isPublic: input.isPublic,
  } satisfies PrivateCard);

  const photoRef = doc(cardRef, ...PHOTO_PATH);
  if (input.photo !== null) {
    batch.set(photoRef, { uid: card.uid, dataUrl: input.photo } satisfies CardPhoto);
  } else if (card.hasPhoto) {
    batch.delete(photoRef);
  }

  await batch.commit();
};

/**
 * 명함을 지운다.
 *
 * Firestore 는 하위 문서를 따라 지워주지 않는다. 공개 문서만 지우면
 * 원본과 사진이 주인 없이 남으므로 같은 배치로 함께 지운다.
 */
export const deleteCard = async (card: CardDocument): Promise<void> => {
  const db = requireDb();
  const cardRef = doc(db, card.collection, card.id);

  const batch = writeBatch(db);
  batch.delete(doc(cardRef, ...PRIVATE_CARD_PATH));
  // 길잡이를 남겨두면 없는 명함을 가리킨다.
  if (card.serialNumber) batch.delete(doc(db, SERIAL_COLLECTION, card.serialNumber));
  // 없는 문서를 지우려 하면 resource 가 비어 규칙 검사에서 막힌다.
  if (card.hasPhoto) batch.delete(doc(cardRef, ...PHOTO_PATH));
  batch.delete(cardRef);

  await batch.commit();
};

/** 일련번호로 찾은 결과. 번호 형식이 틀렸는지, 없는 번호인지 구분한다. */
export type SerialLookup =
  | { status: "found"; card: CardDocument }
  | { status: "invalid" }
  | { status: "missing" };

/**
 * 일련번호로 명함을 찾는다.
 *
 * 길잡이 문서를 한 번 읽어 어느 컬렉션의 어느 문서인지 알아낸 뒤
 * 그 명함을 읽는다. 목록 조회를 열지 않고도 찾아갈 수 있다.
 */
export const findCardBySerial = async (value: string): Promise<SerialLookup> => {
  const serialNumber = normalizeSerial(value);
  if (!serialNumber) return { status: "invalid" };

  const db = requireDb();
  const pointer = await getDoc(doc(db, SERIAL_COLLECTION, serialNumber));
  if (!pointer.exists()) return { status: "missing" };

  const { collection: collectionName, cardId } = pointer.data() as SerialPointer;
  const snapshot = await getDoc(doc(db, collectionName, cardId));
  // 명함은 지웠는데 길잡이만 남은 경우도 없는 것으로 본다.
  if (!snapshot.exists()) return { status: "missing" };

  return {
    status: "found",
    card: toCardDocument(
      snapshot.id,
      collectionName,
      snapshot.data() as Partial<PublicCard>
    ),
  };
};

/** 길잡이를 만들 때 필요한 것만 추린 형태 */
type PointerTarget = Pick<
  CardDocument,
  "id" | "collection" | "serialNumber" | "uid"
>;

/**
 * 일련번호 길잡이가 없으면 만든다.
 *
 * 명함을 만든 직후와, 명함을 열어볼 때 부른다. 길잡이가 생기기 전에
 * 만들어진 명함도 누군가 한 번 열어보면 그때부터 찾을 수 있다.
 *
 * 실패해도 명함 자체에는 영향이 없으므로 조용히 넘어간다. 규칙이
 * 명함을 읽어 확인하므로 엉뚱한 곳을 가리키게 만들 수는 없다.
 */
export const ensureSerialPointer = async (card: PointerTarget): Promise<void> => {
  if (!card.serialNumber) return;

  try {
    const ref = doc(requireDb(), SERIAL_COLLECTION, card.serialNumber);
    if ((await getDoc(ref)).exists()) return;

    await setDoc(ref, {
      collection: card.collection,
      cardId: card.id,
      uid: card.uid,
    } satisfies SerialPointer);
  } catch (error) {
    console.warn("Could not write serial pointer:", error);
  }
};
