import { buildCardFields } from "../data/formFields";
import { FormValues, FormVisibility, IFormField } from "../types/formType";
import { SELF_VALUE, selfFieldId, subFieldId, valueFieldId } from "./formUtil";

/** 명함에 표시되는 항목 하나 */
export interface CardEntry {
  id: string;
  label: string;
  value: string;
}

/** 명함 상단에 크게 쓰이는 항목 */
export const HEADLINE_ENTRY_IDS = ["name", "bio"] as const;

// 헷갈리기 쉬운 I, L, O, U 를 뺀 32자. (Crockford Base32)
// 32 가 256 의 약수라 바이트를 그대로 써도 분포가 치우치지 않는다.
const SERIAL_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const SERIAL_LENGTH = 10;
const SERIAL_GROUP_SIZE = 5;

/** 사람이 옮겨 적을 수 있는 명함 일련번호를 만든다. 예) "7K3FM-9P2XR" */
export const createSerialNumber = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(SERIAL_LENGTH));
  const chars = Array.from(bytes, (byte) => SERIAL_ALPHABET[byte % SERIAL_ALPHABET.length]);

  return [
    chars.slice(0, SERIAL_GROUP_SIZE).join(""),
    chars.slice(SERIAL_GROUP_SIZE).join(""),
  ].join("-");
};

/** select 에 저장된 값을 사람이 읽는 문자열로 바꾼다. */
const resolveChoice = (
  field: IFormField,
  id: string,
  values: FormValues
): string => {
  const selected = values[id]?.trim() ?? "";
  if (!selected) return "";

  if (selected === SELF_VALUE) return values[selfFieldId(id)]?.trim() ?? "";

  return field.options?.find((option) => option.value === selected)?.label ?? selected;
};

const displayValueOf = (
  field: IFormField,
  id: string,
  values: FormValues
): string => {
  if (field.type === "custom") return values[valueFieldId(id)]?.trim() ?? "";
  if (field.type === "select") return resolveChoice(field, id, values);

  return values[id]?.trim() ?? "";
};

const displayLabelOf = (
  field: IFormField,
  id: string,
  values: FormValues,
  parent?: { field: IFormField; id: string }
): string => {
  // 추가 항목은 사용자가 고른 제목이 곧 이름이다.
  if (field.type === "custom") return resolveChoice(field, id, values) || field.label;

  // SNS 처럼 상위 select 가 항목 이름을 정하는 경우 그 이름을 쓴다. (예: "인스타그램")
  if (parent?.field.type === "select") {
    return resolveChoice(parent.field, parent.id, values) || field.label;
  }

  return field.label;
};

const collectEntries = (
  fields: IFormField[],
  values: FormValues,
  isPublic: FormVisibility,
  parent?: { field: IFormField; id: string }
): CardEntry[] =>
  fields.flatMap((field) => {
    const id = parent ? subFieldId(parent.id, field.id) : field.id;
    const entries: CardEntry[] = [];

    if (field.publishable !== false && isPublic[id]) {
      const value = displayValueOf(field, id, values);
      if (value) {
        entries.push({ id, label: displayLabelOf(field, id, values, parent), value });
      }
    }

    if (field.subFields) {
      entries.push(...collectEntries(field.subFields, values, isPublic, { field, id }));
    }

    return entries;
  });

/** 저장된 값에서 사용자가 추가한 항목의 id 를 복원한다. */
const customFieldIdsOf = (values: FormValues): string[] =>
  Object.keys(values)
    .filter((key) => /^custom_\d+$/.test(key))
    .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1]));

/**
 * 공개로 설정한 항목만 표시용 목록으로 만든다.
 * 이 결과만 공개 문서에 저장하므로, 비공개 항목은 애초에 내려가지 않는다.
 */
export const toCardEntries = (
  values: FormValues,
  isPublic: FormVisibility
): CardEntry[] =>
  collectEntries(buildCardFields(customFieldIdsOf(values)), values, isPublic);

export const findEntry = (entries: CardEntry[], id: string) =>
  entries.find((entry) => entry.id === id);

/** 상단에 따로 쓰는 항목을 뺀 나머지 */
export const detailEntries = (entries: CardEntry[]) =>
  entries.filter((entry) => !HEADLINE_ENTRY_IDS.includes(entry.id as never));
