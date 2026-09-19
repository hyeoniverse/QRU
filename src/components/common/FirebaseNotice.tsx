import styled from "styled-components";
import { FaCircleInfo } from "react-icons/fa6";
import { missingFirebaseConfig } from "../../services/firebase";

interface Props {
  /** 어떤 동작이 막혔는지 알려주는 한 문장 */
  description: string;
}

/** Firebase 설정이 없어 기능을 쓸 수 없을 때 대신 보여준다. */
function FirebaseNotice({ description }: Props) {
  return (
    <StyledFirebaseNotice role="status">
      <FaCircleInfo className="notice-icon" />

      <div className="notice-body">
        <p className="notice-title">Firebase 설정이 필요합니다</p>
        <p>{description}</p>

        {missingFirebaseConfig.length > 0 && (
          <>
            <p className="notice-label">
              프로젝트 루트의 <code>.env</code> 에서 비어 있는 값
            </p>
            <ul className="notice-keys">
              {missingFirebaseConfig.map((key) => (
                <li key={key}>
                  <code>{key}</code>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="notice-hint">
          값은 Firebase 콘솔의 프로젝트 설정에서, 또는{" "}
          <code>firebase apps:sdkconfig web</code> 으로 확인할 수 있습니다.
          채운 뒤 개발 서버를 다시 시작해주세요.
        </p>
      </div>
    </StyledFirebaseNotice>
  );
}

const StyledFirebaseNotice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
  padding: 1.5rem;

  background: ${({ theme }) => theme.color.blur};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadow.light};
  word-break: keep-all;

  .notice-icon {
    flex-shrink: 0;
    margin-top: 0.2rem;
    color: ${({ theme }) => theme.color.primary};
  }

  .notice-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    p {
      margin: 0;
      font-size: ${({ theme }) => theme.fontSize.small};
      line-height: 1.6;
    }
  }

  .notice-title {
    font-weight: bold;
    color: ${({ theme }) => theme.color.text};
  }

  .notice-label,
  .notice-hint {
    color: ${({ theme }) => theme.color.textSecondary};
    font-size: ${({ theme }) => theme.fontSize.extraSmall} !important;
  }

  .notice-keys {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  code {
    user-select: text;
    padding: 0.1rem 0.4rem;
    border-radius: ${({ theme }) => theme.borderRadius.default};
    background: ${({ theme }) => theme.color.surface};
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.text};
  }
`;

export default FirebaseNotice;
