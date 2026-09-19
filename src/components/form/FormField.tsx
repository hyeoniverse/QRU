import { FaTrash } from "react-icons/fa";
import {
  FormErrors,
  FormValues,
  FormVisibility,
  IFormField,
} from "../../types/formType";
import {
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
  } = field;

  const value = values[id] ?? "";
  const isChoice = type === "select" || type === "custom";

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
        {renderError(contentId)}
      </>
    );
  };

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
    );
  };

  return (
    <div className={`form-group ${type === "custom" ? "custom" : ""}`}>
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
          <InputCheck
            id={`${id}-public`}
            name={id}
            label="공개"
            checked={isPublic[id] ?? false}
            onChange={(event) => onVisibilityChange(id, event.target.checked)}
          />
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

      {subFields?.map((subField) => (
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
  );
}

export default FormField;
