import { useState } from "react";
import styled from "styled-components";
import { FaCheck } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import Button from "../common/Button";
import InputText from "../common/InputText";

export const MIN_PASSWORD_LENGTH = 6;

interface Props {
  onSubmit: (password: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/** 비회원이 명함을 수정/삭제할 때 쓸 비밀번호를 입력받는다. */
function PasswordPopup({ onSubmit, onCancel, isSubmitting }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상 입력해주세요.`);
      return;
    }

    setError(null);
    onSubmit(password);
  };

  return (
    <StyledPasswordPopup role="dialog" aria-modal="true" aria-label="비밀번호 입력">
      <form className="popup-content" onSubmit={handleSubmit} noValidate>
        <label htmlFor="card-password">
          비밀번호 ({MIN_PASSWORD_LENGTH}자 이상)
        </label>
        <InputText
          id="card-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          placeholder="비밀번호를 입력하세요"
        />
        {error && (
          <p className="popup-error" role="alert">
            {error}
          </p>
        )}
        <div className="popup-buttons">
          <Button
            type="submit"
            size="small"
            scheme="primary"
            disabled={isSubmitting}
          >
            <FaCheck /> 확인
          </Button>
          <Button type="button" size="small" onClick={onCancel}>
            <FaX /> 취소
          </Button>
        </div>
      </form>
    </StyledPasswordPopup>
  );
}

const StyledPasswordPopup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${({ theme }) => theme.color.surface};
  padding: 2rem;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadow.default};
  z-index: 9999;

  .popup-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    label {
      font-size: 1rem;
      font-weight: bold;
    }

    .popup-error {
      margin: -0.5rem 0 0;
      color: ${({ theme }) => theme.color.error};
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
    }

    .popup-buttons {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
    }
  }
`;

export default PasswordPopup;
