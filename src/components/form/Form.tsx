import React from "react";
import styled from "styled-components";
import {
  FormErrors,
  FormValues,
  FormVisibility,
  IFormField,
} from "../../types/formType";
import { CARD_FORM_ID } from "../../utils/formUtil";
import FormField, { FieldHandlers } from "./FormField";

interface Props extends FieldHandlers {
  /** 폼 바깥의 버튼에서 submit 할 수 있도록 노출하는 id */
  id?: string;
  fields: IFormField[];
  values: FormValues;
  isPublic: FormVisibility;
  errors: FormErrors;
  onSubmit: () => void;
  onCustomFieldRemove?: (id: string) => void;
}

/**
 * 필드 정의를 화면으로 옮기기만 하는 표현 컴포넌트.
 * 상태와 검증은 useCardForm 이 담당한다.
 */
function Form({
  id = CARD_FORM_ID,
  fields,
  values,
  isPublic,
  errors,
  onSubmit,
  onCustomFieldRemove,
  ...handlers
}: Props) {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <StyledForm id={id} onSubmit={handleSubmit} noValidate>
      {fields.map((field) => (
        <FormField
          key={field.id}
          field={field}
          values={values}
          isPublic={isPublic}
          errors={errors}
          onRemove={field.type === "custom" ? onCustomFieldRemove : undefined}
          {...handlers}
        />
      ))}
    </StyledForm>
  );
}

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &.custom {
      background: ${({ theme }) => theme.color.blur};
      padding: 1rem;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      border-radius: ${({ theme }) => theme.borderRadius.default};
      box-shadow: ${({ theme }) => theme.shadow.default};
    }

    .form-field {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: end;
      gap: 0.5rem;
      padding-left: 1rem;

      .form-buttons {
        display: flex;
        flex-direction: row;
        flex-grow: 1;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .field-label {
      font-weight: bold;
    }

    .required {
      color: ${({ theme }) => theme.color.primary};
      margin-left: 0.25rem;
    }

    .error-message {
      margin: 0;
      padding-left: 1rem;
      color: ${({ theme }) => theme.color.error};
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
    }
  }
`;

export default Form;
