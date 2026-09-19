import React from "react";
import styled from "styled-components";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const InputText = React.forwardRef<HTMLInputElement, Props>(
  ({ label, ...props }, ref) => (
    <StyledInputText className="input-text">
      {label && <label htmlFor={props.id}>{label}</label>}
      <input ref={ref} type="text" {...props} />
    </StyledInputText>
  )
);

InputText.displayName = "InputText";

const StyledInputText = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  line-height: 1.8;

  label {
    margin-left: 0.5rem;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.text};
  }

  input {
    display: flex;
    width: 100%;
    height: fit-content;
    border: none;
    outline: none;
    box-shadow: ${({ theme }) => theme.shadow.light};
    overflow: visible;
    padding: 0.6rem 1.2rem;
    line-height: 1.8;

    color: ${({ theme }) => theme.color.text};
    background: ${({ theme }) => theme.color.blur};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    font-size: ${({ theme }) => theme.fontSize.small};

    &:focus {
      box-shadow: ${({ theme }) => theme.shadow.default};
      background: ${({ theme }) => theme.color.surface};
    }

    &::placeholder {
      color: ${({ theme }) => theme.color.textSecondary};
    }

    /* 다른 값에서 자동으로 채워지는 입력 */
    &:read-only {
      color: ${({ theme }) => theme.color.textSecondary};
      cursor: default;

      &:focus {
        background: ${({ theme }) => theme.color.blur};
        box-shadow: ${({ theme }) => theme.shadow.light};
      }
    }
  }
`;

export default InputText;
