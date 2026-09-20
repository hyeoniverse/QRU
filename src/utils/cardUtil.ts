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
export const customFieldIdsOf = (values: FormValues): string[] =>
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

/**
 * 항목 id -> 정규화된 값.
 *
 * entries 는 표시용 배열이라 Firestore 로 조건 검색을 할 수 없다.
 * (배열 원소의 특정 필드로 거르는 질의를 지원하지 않는다)
 * 그래서 공개 항목 전부를 검색용 맵으로 한 번 더 저장한다.
 *
 * 모든 조건을 "같음" 으로만 질의하면 Firestore 가 단일 필드 색인을
 * 합쳐서 처리하므로 복합 색인을 만들 필요가 없다. 조건을 몇 개
 * 조합하든 색인 설정이 늘어나지 않는다.
 */
export type CardSearchIndex = Record<string, string>;

/** 대소문자와 앞뒤 공백 차이로 안 걸리는 일이 없게 맞춰둔다. */
export const normalizeSearchValue = (value: string): string =>
  value.trim().toLowerCase();

/** 라벨 쪽을 가리키는 색인 키. 예) sns_id -> sns_id_label */
export const labelSearchKey = (entryId: string) => `${entryId}_label`;

/**
 * 공개 항목 전부를 검색용 맵으로 만든다.
 *
 * 값뿐 아니라 라벨도 넣는다. SNS 종류("인스타그램")나 추가 항목 제목
 * ("소속/회사")처럼 내용이 라벨 쪽에 담기는 항목이 있기 때문이다.
 */
export const createSearchIndex = (entries: CardEntry[]): CardSearchIndex =>
  entries.reduce<CardSearchIndex>((index, entry) => {
    const value = normalizeSearchValue(entry.value);
    const label = normalizeSearchValue(entry.label);

    if (value) index[entry.id] = value;
    if (label) index[labelSearchKey(entry.id)] = label;

    return index;
  }, {});

/**
 * 자유 입력 검색어와 맞는지 본다.
 *
 * Firestore 는 부분 일치를 지원하지 않아 이 판단만 화면 쪽에서 한다.
 * 공개 항목의 라벨과 값을 모두 훑으므로 "등산", "INFP", "3월" 처럼
 * 아무 항목이나 걸린다.
 */
export const matchesSearchText = (
  entries: CardEntry[],
  text: string
): boolean => {
  const needle = normalizeSearchValue(text);
  if (!needle) return true;

  return entries.some(
    (entry) =>
      normalizeSearchValue(entry.value).includes(needle) ||
      normalizeSearchValue(entry.label).includes(needle)
  );
};
