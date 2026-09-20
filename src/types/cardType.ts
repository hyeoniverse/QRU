import { Timestamp } from "firebase/firestore";
import { CardEntry, CardSearchIndex } from "../utils/cardUtil";
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
 * 사진이 들어가는 하위 문서 경로.
 *
 * 명함 문서에 같이 넣으면 셔플 질의가 후보 수십 장을 가져올 때마다
 * 사진까지 따라온다. 한 장을 볼 때만 읽도록 따로 둔다.
 */
export const PHOTO_PATH = ["photo", "data"] as const;

export type CardPhoto = {
  /** private 문서와 같은 방식으로 소유권을 판단한다. */
  uid: string | null;
  /** 줄여서 담은 JPEG 데이터 URL */
  dataUrl: string;
};

/**
 * 누구나 읽을 수 있는 공개 문서.
 * "공개"로 설정한 항목만 들어간다. 비공개 항목은 아예 저장되지 않는다.
 *
 * createdAt 은 서버 시각으로 저장한다. 비회원 명함 만료를 이 값으로
 * 판단하므로, 클라이언트가 정하게 두면 만료를 피할 수 있다.
 */
export type PublicCard = {
  serialNumber: string;
  uid: string | null;
  createdAt: Timestamp;
  entries: CardEntry[];
  /** 랜덤 셔플 결과에 노출할지 */
  inShuffle: boolean;
  /** 항목 id -> 정규화된 값. 조건 검색에만 쓴다. */
  search: CardSearchIndex;
  /** 사진 하위 문서가 있는지. 있을 때만 따로 읽는다. */
  hasPhoto: boolean;
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

/** 화면에서 다루는 명함. createdAt 은 다루기 쉬운 Date 로 바꿔서 전달한다. */
export type CardDocument = Omit<PublicCard, "createdAt"> & {
  id: string;
  createdAt: Date | null;
  /** 사진을 읽을 때 어느 컬렉션을 볼지 알기 위해 담아둔다. */
  collection: CardCollection;
};

/**
 * 명함 수정 입력.
 *
 * 일련번호와 만든 시각, 소유자는 바뀌지 않는다. 이미 공유된 값이라
 * 규칙에서도 그대로인지 확인한다.
 */
export type CardUpdate = {
  values: FormValues;
  isPublic: FormVisibility;
  inShuffle: boolean;
  /** 줄여서 담은 JPEG 데이터 URL. null 이면 사진을 지운다. */
  photo: string | null;
};

/** 명함 생성 입력 */
export type NewCard = {
  values: FormValues;
  isPublic: FormVisibility;
  uid: string | null;
  /** 랜덤 셔플 결과에 노출할지 */
  inShuffle: boolean;
  /** 줄여서 담은 JPEG 데이터 URL. 없으면 사진 없이 만든다. */
  photo?: string;
  password?: PasswordDigest;
};
