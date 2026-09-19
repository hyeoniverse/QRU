import { FieldType, FormValues, FormVisibility, IFormField } from "../types/formType";
import { calculateAge, formatBirthday, parseISODate } from "./dateUtil";

/** select 에서 "직접 입력"을 고른 상태를 나타내는 값 */
export const SELF_VALUE = "self";

/** 모달 바깥의 버튼에서 form 을 submit 하기 위한 id */
export const CARD_FORM_ID = "card-form";

/** 자동 계산 로직이 붙어 있는 필드 id */
export const FIELD_ID = {
  birth: "birth",
  birthday: "birthday",
  age: "age",
} as const;

/** 하위 필드의 실제 키. 예) birth + birthday -> "birth_birthday" */
export const subFieldId = (parentId: string, childId: string) => `${parentId}_${childId}`;

/** "직접 입력"을 고른 select 의 입력값 키 */
export const selfFieldId = (id: string) => `${id}_self`;

/** 추가 항목의 내용 입력값 키 */
export const valueFieldId = (id: string) => `${id}_value`;

/** FieldType -> input[type] */
export const htmlInputType = (type: FieldType): string => {
  switch (type) {
    case "email":
    case "number":
    case "tel":
      return type;
    default:
      return "text";
  }
};

/**
 * 한 필드의 값이 바뀔 때 함께 갱신되어야 하는 값들.
 * 생년월일을 고르면 생일/나이가 따라온다.
 */
export const deriveValues = (id: string, value: string): FormValues => {
  if (id !== FIELD_ID.birth) return {};

  const birthdayId = subFieldId(FIELD_ID.birth, FIELD_ID.birthday);
  const ageId = subFieldId(FIELD_ID.birth, FIELD_ID.age);
  const date = parseISODate(value);

  if (!date) return { [birthdayId]: "", [ageId]: "" };

  return {
    [birthdayId]: formatBirthday(date),
    [ageId]: String(calculateAge(date)),
  };
};

/** 필수 항목은 기본적으로 공개 상태로 시작한다. */
export const createInitialVisibility = (fields: IFormField[]): FormVisibility =>
  fields.reduce<FormVisibility>((visibility, field) => {
    if (field.required && field.publishable !== false) {
      visibility[field.id] = true;
    }
    return visibility;
  }, {});

/** 특정 필드와 그 하위 키들을 값 맵에서 제거한다. */
export const omitKeys = <T,>(source: Record<string, T>, prefix: string): Record<string, T> =>
  Object.fromEntries(
    Object.entries(source).filter(([key]) => key !== prefix && !key.startsWith(`${prefix}_`))
  );

/** 키 하나만 제거한 새 객체를 돌려준다. 없으면 원본을 그대로 돌려준다. */
export const omitKey = <T,>(source: Record<string, T>, key: string): Record<string, T> => {
  if (!(key in source)) return source;

  const next = { ...source };
  delete next[key];
  return next;
};
