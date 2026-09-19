import { CardEntry } from "../utils/cardUtil";
import { PasswordDigest } from "../utils/passwordUtil";
import { FormValues, FormVisibility } from "./formType";

/** 회원/비회원 명함이 저장되는 컬렉션 (분리 유지 여부는 #32 에서 논의 중) */
export const CARD_COLLECTION = {
  member: "cards",
  guest: "guestCards",
} as const;

export type CardCollection =
  (typeof CARD_COLLECTION)[keyof typeof CARD_COLLECTION];

/** 비공개 원본이 들어가는 하위 문서 경로 */
export const PRIVATE_CARD_PATH = ["private", "card"] as const;

/**
 * 누구나 읽을 수 있는 공개 문서.
 * "공개"로 설정한 항목만 들어간다. 비공개 항목은 아예 저장되지 않는다.
 */
export type PublicCard = {
  serialNumber: string;
  uid: string | null;
  createdAt: string;
  entries: CardEntry[];
};

/**
 * 소유자만 접근하는 하위 문서.
 * 나중에 수정 기능에서 쓰려고 입력 원본을 보관한다.
 */
export type PrivateCard = {
  uid: string | null;
  values: FormValues;
  isPublic: FormVisibility;
  /** 비회원이 명함을 관리할 때 쓰는 비밀번호 해시 (검증은 서버에서만 가능) */
  password?: PasswordDigest;
};

/** 화면에서 다루는 명함 */
export type CardDocument = PublicCard & { id: string };

/** 명함 생성 입력 */
export type NewCard = {
  values: FormValues;
  isPublic: FormVisibility;
  uid: string | null;
  password?: PasswordDigest;
};
