import { FormValues, FormVisibility } from "./formType";

/** 회원/비회원 명함이 저장되는 컬렉션 */
export const CARD_COLLECTION = {
  member: "cards",
  guest: "guestCards",
} as const;

export type CardCollection =
  (typeof CARD_COLLECTION)[keyof typeof CARD_COLLECTION];

export type CardPayload = {
  values: FormValues;
  isPublic: FormVisibility;
  createdAt: string;
  uid: string | null;
  /** 비회원 명함을 수정/삭제할 때 쓰는 비밀번호 */
  password?: string;
};
