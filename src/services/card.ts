import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import {
  CARD_COLLECTION,
  CardDocument,
  NewCard,
  PRIVATE_CARD_PATH,
  PrivateCard,
  PublicCard,
} from "../types/cardType";
import { createSerialNumber, toCardEntries } from "../utils/cardUtil";

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
  const collectionName = input.uid
    ? CARD_COLLECTION.member
    : CARD_COLLECTION.guest;

  const cardRef = doc(collection(db, collectionName));
  const serialNumber = createSerialNumber();

  const publicCard: PublicCard = {
    serialNumber,
    uid: input.uid,
    createdAt: new Date().toISOString(),
    entries: toCardEntries(input.values, input.isPublic),
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
 * 문서 id 로 공개 명함을 읽는다. 없으면 null
 *
 * entries 형식을 쓰기 전에 저장된 문서가 남아 있을 수 있어,
 * 빠진 값은 빈 값으로 채워 화면이 깨지지 않게 한다.
 */
export const getCard = async (id: string): Promise<CardDocument | null> => {
  // 회원/비회원 컬렉션이 분리되어 있어 양쪽을 확인한다. (#32)
  for (const collectionName of Object.values(CARD_COLLECTION)) {
    const snapshot = await getDoc(doc(db, collectionName, id));
    if (!snapshot.exists()) continue;

    const data = snapshot.data() as Partial<PublicCard>;

    return {
      id: snapshot.id,
      serialNumber: data.serialNumber ?? "",
      uid: data.uid ?? null,
      createdAt: data.createdAt ?? "",
      entries: Array.isArray(data.entries) ? data.entries : [],
    };
  }

  return null;
};
