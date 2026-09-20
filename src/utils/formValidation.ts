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
  /** 이 키가 속한 묶음. 목차에서 진행 상황을 셀 때 쓴다. */
  group: string;
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
  parent?: { id: string; filled: boolean; group: string }
): FieldRule[] => {
  // 묶음 이름은 그것이 붙은 항목부터 다음 이름이 나올 때까지 이어진다.
  let group = parent?.group ?? "";

  return fields.flatMap((field) => {
    group = field.group ?? group;
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
      group,
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
        group,
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
        group,
        required: true,
        publishable: false,
        minLength: field.minLength,
        maxLength: field.maxLength,
      });
    }

    if (field.subFields) {
      rules.push(
        ...flattenFields(field.subFields, values, {
          id,
          filled: value !== "",
          group,
        })
      );
    }

    return rules;
  });
};

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

/** 목차에서 보여줄 항목 하나의 진행 상황 */
export interface FieldProgress {
  /** 화면에서 이 항목으로 건너뛸 때 쓰는 id */
  id: string;
  label: string;
  group: string;
  /** 이 항목이 가진 입력 칸 수. 생년월일처럼 하위가 있으면 여럿이다. */
  total: number;
  filled: number;
  /** 아직 채워야 하는 칸 수 */
  pending: number;
}

/**
 * 항목마다 얼마나 채웠는지 센다.
 *
 * 비어 있는지 판단하는 기준은 검증과 같은 함수를 쓴다. 목차에서는
 * 다 채웠다고 하는데 제출하면 막히는 일이 없어야 한다.
 */
export const summarizeFields = (
  fields: IFormField[],
  values: FormValues,
  isPublic: FormVisibility
): FieldProgress[] => {
  let group = "";

  return fields.map((field) => {
    group = field.group ?? group;
    const rules = flattenFields([field], values);

    // 추가 항목은 사용자가 고른 제목이 곧 이름이다.
    const label =
      field.type === "custom"
        ? rules.find((rule) => rule.id === valueFieldId(field.id))?.label ??
          field.label
        : field.label;

    return rules.reduce<FieldProgress>(
      (progress, rule) => ({
        ...progress,
        total: progress.total + 1,
        filled:
          progress.filled + ((values[rule.id]?.trim() ?? "") !== "" ? 1 : 0),
        pending:
          progress.pending + (messageFor(rule, values, isPublic) ? 1 : 0),
      }),
      { id: field.id, label, group, total: 0, filled: 0, pending: 0 }
    );
  });
};

/** 목차에서 보여줄 묶음별 진행 상황. 칸이 아니라 항목 수로 센다. */
export interface GroupProgress {
  name: string;
  /** 이 묶음에 속한 항목 수 */
  total: number;
  /** 빠짐없이 채운 항목 수 */
  filled: number;
  /** 아직 채워야 하는 항목 수 */
  pending: number;
}

/**
 * 묶음마다 몇 개를 마쳤는지 센다.
 *
 * 칸이 아니라 항목 단위로 센다. 목차가 항목을 펼쳐 보여주므로,
 * 숫자도 눈에 보이는 줄 수와 맞아야 헷갈리지 않는다.
 */
export const summarizeGroups = (
  fields: IFormField[],
  values: FormValues,
  isPublic: FormVisibility
): GroupProgress[] =>
  summarizeFields(fields, values, isPublic).reduce<GroupProgress[]>(
    (groups, field) => {
      let group = groups.find((item) => item.name === field.group);
      if (!group) {
        group = { name: field.group, total: 0, filled: 0, pending: 0 };
        groups.push(group);
      }

      group.total += 1;
      if (field.total > 0 && field.filled === field.total) group.filled += 1;
      if (field.pending > 0) group.pending += 1;

      return groups;
    },
    []
  );
