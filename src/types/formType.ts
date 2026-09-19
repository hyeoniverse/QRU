export type FieldType =
  | "text"
  | "email"
  | "number"
  | "tel"
  | "select"
  | "date"
  | "custom";

export interface IOption {
  label: string;
  value: string;
}

export interface IFormField {
  id: string;
  label: string;
  type: FieldType;
  /** 값이 비어 있으면 제출할 수 없는 필드 */
  required?: boolean;
  placeholder?: string;
  /** type 이 select / custom 일 때 선택지 */
  options?: IOption[];
  /** 상위 필드에 값이 있을 때만 의미가 있는 하위 필드 */
  subFields?: IFormField[];
  minLength?: number;
  maxLength?: number;
  /** 다른 필드에서 자동으로 계산되는 값 (사용자가 직접 입력하지 않음) */
  readOnly?: boolean;
  /**
   * 공개 여부를 개별적으로 선택할 수 있는지 여부. (기본값 true)
   * 생년월일처럼 하위 필드로 공개 범위를 나누는 필드는 false 로 둔다.
   */
  publishable?: boolean;
}

/** 필드 id -> 입력값 */
export type FormValues = Record<string, string>;
/** 필드 id -> 공개 여부 */
export type FormVisibility = Record<string, boolean>;
/** 필드 id -> 에러 메시지 */
export type FormErrors = Record<string, string>;

export interface IFormSubmit {
  values: FormValues;
  isPublic: FormVisibility;
}
