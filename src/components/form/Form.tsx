import React, { Fragment } from "react";
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
        <Fragment key={field.id}>
          {field.group && <h2 className="form-group-title">{field.group}</h2>}
          <FormField
            field={field}
            values={values}
            isPublic={isPublic}
            errors={errors}
            onRemove={field.type === "custom" ? onCustomFieldRemove : undefined}
            {...handlers}
          />
        </Fragment>
      ))}
    </StyledForm>
  );
}

const StyledForm = styled.form`
  /* 짧은 항목을 나란히 놓아 세로 길이를 줄인다. */
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 1.25rem 1rem;

  .form-group-title {
    grid-column: 1 / -1;
    margin: 1rem 0 0;
    padding-bottom: 0.5rem;

    font-size: ${({ theme }) => theme.fontSize.small};
    color: ${({ theme }) => theme.color.primary};
    border-bottom: 1px solid ${({ theme }) => theme.color.blur};

    &:first-child {
      margin-top: 0;
    }
  }

  .form-group {
    grid-column: 1 / -1;

    &.span-half {
      grid-column: span 1;
    }

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

      .form-buttons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .field-label {
      font-weight: bold;
    }

    /* 공개 여부는 오른쪽 끝에 붙여 라벨과 헷갈리지 않게 한다. */
    .field-visibility {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-left: auto;
      cursor: pointer;
      white-space: nowrap;

      span {
        font-size: ${({ theme }) => theme.fontSize.extraSmall};
        color: ${({ theme }) => theme.color.textSecondary};
      }
    }

    /* 하위 항목도 같은 규칙으로 나란히 놓는다. */
    .field-subfields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
      gap: 1rem;
    }

    .field-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .suggestion {
      padding: 0.2rem 0.7rem;
      border: none;
      border-radius: ${({ theme }) => theme.borderRadius.rounded};

      background: ${({ theme }) => theme.color.blur};
      box-shadow: ${({ theme }) => theme.shadow.light};
      color: ${({ theme }) => theme.color.textSecondary};
      font-family: inherit;
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
      line-height: 1.6;
      cursor: pointer;

      &:hover {
        color: ${({ theme }) => theme.color.text};
      }

      &.picked {
        background: ${({ theme }) => theme.color.primary};
        color: ${({ theme }) => theme.color.onPrimary};
      }
    }

    .required {
      color: ${({ theme }) => theme.color.primary};
      margin-left: 0.25rem;
    }

    /*
     * 오류 문구와 글자수가 함께 놓이는 줄.
     * 비어 있어도 한 줄만큼 자리를 잡아, 오류가 떴다 사라져도
     * 아래 항목이 밀리지 않는다.
     */
    .field-footer {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
      /* 예약 높이가 실제 줄 높이와 어긋나면 그만큼 밀린다. 같은 값을 쓴다. */
      line-height: 1.5;
      min-height: 1.5em;
    }

    /*
     * 두 칸으로 줄어든 항목은 오류 문구와 글자수가 한 줄에 다 들어가지
     * 않아 두 줄이 된다. 미리 두 줄만큼 잡아둔다.
     */
    &.span-half .field-footer {
      min-height: 3em;
    }

    /* 글자수는 오른쪽 끝에 조용히 둔다. */
    .field-counter {
      margin: 0 0 0 auto;
      text-align: right;
      white-space: nowrap;
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
      color: ${({ theme }) => theme.color.textSecondary};

      &.near {
        color: ${({ theme }) => theme.color.warning};
      }

      &.over {
        color: ${({ theme }) => theme.color.error};
        font-weight: bold;
      }
    }

    .error-message {
      margin: 0;
      color: ${({ theme }) => theme.color.error};
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
    }
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    grid-template-columns: minmax(0, 1fr);

    .form-group.span-half {
      grid-column: 1 / -1;
    }

    .field-subfields {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

export default Form;
