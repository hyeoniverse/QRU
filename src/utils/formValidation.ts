import { FormErrors, FormValues, FormVisibility, IFormField } from "../types/formType";
import {
  SELF_INPUT_MAX_LENGTH,
  SELF_VALUE,
  selfFieldId,
  subFieldId,
  valueFieldId,
} from "./formUtil";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ValueFormat = "email" | "number";

/** 값이 실제로 저장되는 키 하나에 대한 검증 규칙 */
interface FieldRule {
  id: string;
  label: string;
  /** 공개 여부와 무관하게 항상 입력해야 하는지 */
  required: boolean;
  /** 공개로 설정했을 때 입력이 강제되는지 (공개 토글이 붙은 키인지) */
  publishable: boolean;
  minLength?: number;
  maxLength?: number;
  format?: ValueFormat;
}

const formatOf = (field: IFormField): ValueFormat | undefined =>
  field.type === "email" || field.type === "number" ? field.type : undefined;

/** 추가 항목에서 사용자가 고른 제목을 사람이 읽을 수 있는 이름으로 바꾼다. */
const resolveLabel = (field: IFormField, values: FormValues): string => {
  const selected = values[field.id]?.trim();
  if (!selected) return field.label;

  if (selected === SELF_VALUE) {
    return values[selfFieldId(field.id)]?.trim() || field.label;
  }

  return field.options?.find((option) => option.value === selected)?.label ?? field.label;
};

/**
 * 중첩된 필드 정의를 "값이 저장되는 키" 단위로 펼친다.
 * 렌더링과 검증이 같은 규칙으로 id 를 만들도록 이 함수를 단일 기준으로 둔다.
 */
const flattenFields = (
  fields: IFormField[],
  values: FormValues,
  parent?: { id: string; filled: boolean }
): FieldRule[] =>
  fields.flatMap((field) => {
    const id = parent ? subFieldId(parent.id, field.id) : field.id;
    const value = values[id]?.trim() ?? "";
    const publishable = field.publishable !== false;

    // 상위 필드를 채웠다면 하위 필드도 함께 채워야 한다. (자동 계산 필드는 제외)
    const required = Boolean(field.required || (parent?.filled && !field.readOnly));

    const rules: FieldRule[] = [];
    const isChoice = field.type === "select" || field.type === "custom";

    rules.push({
      id,
      label: field.label,
      required,
      publishable,
      minLength: isChoice ? undefined : field.minLength,
      maxLength: isChoice ? undefined : field.maxLength,
      format: formatOf(field),
    });

    if (isChoice && value === SELF_VALUE) {
      rules.push({
        id: selfFieldId(id),
        label: `${field.label} 직접 입력`,
        required: true,
        publishable: false,
        minLength: 1,
        maxLength: SELF_INPUT_MAX_LENGTH,
      });
    }

    if (field.type === "custom") {
      rules.push({
        id: valueFieldId(id),
        label: resolveLabel({ ...field, id }, values),
        required: true,
        publishable: false,
        minLength: field.minLength,
        maxLength: field.maxLength,
      });
    }

    if (field.subFields) {
      rules.push(
        ...flattenFields(field.subFields, values, { id, filled: value !== "" })
      );
    }

    return rules;
  });

const messageFor = (
  rule: FieldRule,
  values: FormValues,
  isPublic: FormVisibility
): string | null => {
  const value = values[rule.id]?.trim() ?? "";

  if (!value) {
    if (rule.required) return `"${rule.label}" 란은 필수 입력 사항입니다.`;
    if (rule.publishable && isPublic[rule.id]) {
      return `공개로 설정한 "${rule.label}" 란은 비울 수 없습니다.`;
    }
    return null;
  }

  if (rule.minLength && value.length < rule.minLength) {
    return `"${rule.label}"은(는) 최소 ${rule.minLength}자 이상 입력해야 합니다.`;
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    return `"${rule.label}"은(는) 최대 ${rule.maxLength}자까지 입력할 수 있습니다.`;
  }

  if (rule.format === "email" && !EMAIL_PATTERN.test(value)) {
    return `"${rule.label}"에 올바른 이메일 주소를 입력해주세요.`;
  }

  if (rule.format === "number" && Number.isNaN(Number(value))) {
    return `"${rule.label}"에 숫자를 입력해주세요.`;
  }

  return null;
};

/** 폼 전체 검증. 필드 정의 순서대로 에러가 담긴다. */
export const validateForm = (
  fields: IFormField[],
  values: FormValues,
  isPublic: FormVisibility
): FormErrors =>
  flattenFields(fields, values).reduce<FormErrors>((errors, rule) => {
    const message = messageFor(rule, values, isPublic);
    if (message) errors[rule.id] = message;
    return errors;
  }, {});

/** 키 하나만 검증. (blur 처리용) */
export const validateValue = (
  fields: IFormField[],
  values: FormValues,
  isPublic: FormVisibility,
  id: string
): string | null => {
  const rule = flattenFields(fields, values).find((item) => item.id === id);
  return rule ? messageFor(rule, values, isPublic) : null;
};

/**
 * 현재 필드 구성에서 실제로 살아 있는 값만 모은다.
 * 선택을 바꾸면서 남은 "직접 입력" 값처럼 화면에 없는 값이 저장되는 것을 막는다.
 */
export const collectValues = (
  fields: IFormField[],
  values: FormValues
): FormValues =>
  flattenFields(fields, values).reduce<FormValues>((collected, rule) => {
    const value = values[rule.id]?.trim();
    if (value) collected[rule.id] = value;
    return collected;
  }, {});

/** 살아 있는 필드의 공개 설정만 모은다. */
export const collectVisibility = (
  fields: IFormField[],
  values: FormValues,
  isPublic: FormVisibility
): FormVisibility =>
  flattenFields(fields, values).reduce<FormVisibility>((collected, rule) => {
    if (rule.publishable) collected[rule.id] = isPublic[rule.id] ?? false;
    return collected;
  }, {});
