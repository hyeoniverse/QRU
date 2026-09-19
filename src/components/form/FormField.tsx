import { FaTrash } from "react-icons/fa";
import {
  FormErrors,
  FormValues,
  FormVisibility,
  IFormField,
} from "../../types/formType";
import {
  SELF_INPUT_MAX_LENGTH,
  SELF_VALUE,
  htmlInputType,
  selfFieldId,
  subFieldId,
  valueFieldId,
} from "../../utils/formUtil";
import Button from "../common/Button";
import InputCheck from "../common/InputCheck";
import InputDate from "../common/InputDate";
import InputSelect from "../common/InputSelect";
import InputText from "../common/InputText";

export interface FieldHandlers {
  onValueChange: (id: string, value: string) => void;
  onVisibilityChange: (id: string, isPublic: boolean) => void;
  onFieldBlur: (id: string) => void;
}

interface Props extends FieldHandlers {
  field: IFormField;
  values: FormValues;
  isPublic: FormVisibility;
  errors: FormErrors;
  /** 추가 항목처럼 삭제할 수 있는 필드에만 전달한다. */
  onRemove?: (id: string) => void;
}

function FormField({
  field,
  values,
  isPublic,
  errors,
  onValueChange,
  onVisibilityChange,
  onFieldBlur,
  onRemove,
}: Props) {
  const {
    id,
    label,
    type,
    required,
    placeholder,
    options,
    subFields,
    readOnly,
    publishable = true,
    suggestions,
    span = "full",
  } = field;

  const value = values[id] ?? "";
  const isChoice = type === "select" || type === "custom";

  /**
   * 남은 글자수를 보여준다. 넘치면 몇 자를 넘겼는지 알려준다.
   *
   * maxLength 속성으로 막지 않는 이유는, 붙여넣기 한 글이 말없이
   * 잘리는 것보다 넘쳤다고 알려주는 편이 낫기 때문이다.
   */
  const renderCounter = (fieldId: string, limit?: number) => {
    if (!limit) return null;

    const length = (values[fieldId] ?? "").trim().length;
    const over = length - limit;

    return (
      <p className={over > 0 ? "field-counter over" : "field-counter"}>
        {over > 0 ? `${length} / ${limit} · ${over}자 초과` : `${length} / ${limit}`}
      </p>
    );
  };

  const renderError = (fieldId: string) =>
    errors[fieldId] ? (
      <p className="error-message" role="alert">
        {errors[fieldId]}
      </p>
    ) : null;

  /** select 에서 "직접 입력"을 골랐을 때 나타나는 입력 */
  const renderSelfInput = () => {
    const selfId = selfFieldId(id);

    return (
      <>
        <InputText
          id={selfId}
          name={selfId}
          placeholder={type === "custom" ? `${label} 제목 입력` : `${label} 입력`}
          value={values[selfId] ?? ""}
          onChange={(event) => onValueChange(selfId, event.target.value)}
          onBlur={() => onFieldBlur(selfId)}
        />
        {renderCounter(selfId, SELF_INPUT_MAX_LENGTH)}
        {renderError(selfId)}
      </>
    );
  };

  /** 추가 항목의 내용 입력 */
  const renderCustomValueInput = () => {
    const contentId = valueFieldId(id);

    return (
      <>
        <InputText
          id={contentId}
          name={contentId}
          placeholder={`${label} 내용 입력`}
          value={values[contentId] ?? ""}
          onChange={(event) => onValueChange(contentId, event.target.value)}
          onBlur={() => onFieldBlur(contentId)}
        />
        {renderCounter(contentId, field.maxLength)}
        {renderError(contentId)}
      </>
    );
  };

  /**
   * 추천 값을 눌러 넣고 뺀다.
   * 쉼표로 구분한 목록으로 다루므로 이미 들어 있으면 지운다.
   */
  const pickedSuggestions = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const toggleSuggestion = (keyword: string) => {
    const next = pickedSuggestions.includes(keyword)
      ? pickedSuggestions.filter((item) => item !== keyword)
      : [...pickedSuggestions, keyword];

    onValueChange(id, next.join(", "));
  };

  const renderSuggestions = () =>
    suggestions?.length ? (
      <ul className="field-suggestions">
        {suggestions.map((keyword) => {
          const picked = pickedSuggestions.includes(keyword);

          return (
            <li key={keyword}>
              <button
                type="button"
                className={picked ? "suggestion picked" : "suggestion"}
                aria-pressed={picked}
                onClick={() => toggleSuggestion(keyword)}
              >
                {keyword}
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  const renderControl = () => {
    if (isChoice) {
      return (
        <>
          <InputSelect
            id={id}
            name={id}
            value={value}
            options={options ?? []}
            placeholder={placeholder}
            onChange={(next) => onValueChange(id, next)}
            onBlur={() => onFieldBlur(id)}
          />
          {value === SELF_VALUE && renderSelfInput()}
          {type === "custom" && renderCustomValueInput()}
        </>
      );
    }

    if (type === "date") {
      return (
        <InputDate
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(next) => onValueChange(id, next)}
          onBlur={() => onFieldBlur(id)}
        />
      );
    }

    return (
      <>
        <InputText
          id={id}
          name={id}
          type={htmlInputType(type)}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onValueChange(id, event.target.value)}
          onBlur={() => onFieldBlur(id)}
        />
        {renderCounter(id, field.maxLength)}
        {renderSuggestions()}
      </>
    );
  };

  return (
    <div className={`form-group span-${span} ${type === "custom" ? "custom" : ""}`}>
      <div className="form-field">
        <label className="field-label" htmlFor={id}>
          {label}
          {required && (
            <span className="required" aria-hidden="true">
              *
            </span>
          )}
        </label>

        {publishable && (
          <label className="field-visibility" htmlFor={`${id}-public`}>
            <InputCheck
              id={`${id}-public`}
              name={id}
              checked={isPublic[id] ?? false}
              onChange={(event) => onVisibilityChange(id, event.target.checked)}
            />
            <span>공개</span>
          </label>
        )}

        {onRemove && (
          <div className="form-buttons">
            <Button
              type="button"
              size="extraSmall"
              aria-label={`${label} 삭제`}
              onClick={() => onRemove(id)}
            >
              <FaTrash />
            </Button>
          </div>
        )}
      </div>

      {renderControl()}
      {renderError(id)}

      {subFields?.length ? (
        <div className="field-subfields">
          {subFields.map((subField) => (
            <FormField
              key={subField.id}
              field={{ ...subField, id: subFieldId(id, subField.id) }}
              values={values}
              isPublic={isPublic}
              errors={errors}
              onValueChange={onValueChange}
              onVisibilityChange={onVisibilityChange}
              onFieldBlur={onFieldBlur}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default FormField;
