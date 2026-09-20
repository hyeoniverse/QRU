import styled from "styled-components";
import { FaCheck } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import Button from "./Button";

interface Props {
  title: string;
  /** 무엇이 벌어지는지 한 줄로 알려준다. 되돌릴 수 없다면 꼭 적는다. */
  description?: string;
  confirmLabel?: string;
  /** 되돌릴 수 없는 동작이면 확인 버튼을 위험한 색으로 보여준다. */
  isDanger?: boolean;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 되돌릴 수 없는 동작 앞에서 한 번 더 묻는다. */
function ConfirmPopup({
  title,
  description,
  confirmLabel = "확인",
  isDanger,
  isSubmitting,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <StyledConfirmPopup role="dialog" aria-modal="true" aria-label={title}>
      <div className="popup-content">
        <p className="popup-title">{title}</p>
        {description && <p className="popup-description">{description}</p>}

        <div className="popup-buttons">
          <Button
            type="button"
            size="small"
            scheme={isDanger ? "error" : "primary"}
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            <FaCheck /> {confirmLabel}
          </Button>
          <Button type="button" size="small" onClick={onCancel}>
            <FaX /> 취소
          </Button>
        </div>
      </div>
    </StyledConfirmPopup>
  );
}

const StyledConfirmPopup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: min(24rem, calc(100vw - 2rem));
  background: ${({ theme }) => theme.color.surface};
  padding: 2rem;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadow.default};
  z-index: 9999;

  .popup-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .popup-title {
    margin: 0;
    font-size: 1rem;
    font-weight: bold;
  }

  .popup-description {
    margin: -0.5rem 0 0;
    font-size: ${({ theme }) => theme.fontSize.small};
    color: ${({ theme }) => theme.color.textSecondary};
  }

  .popup-buttons {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }
`;

export default ConfirmPopup;
