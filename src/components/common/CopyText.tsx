import styled from "styled-components";
import { FaCheck, FaRegCopy } from "react-icons/fa";
import { useCopy } from "../../hooks/useCopy";

interface Props {
  /** 복사할 값. 화면에도 그대로 보여준다. */
  value: string;
  /** 무엇을 복사하는지. 안내 문구와 읽기 도구에 쓴다. */
  label: string;
}

/**
 * 눌러서 복사하는 짧은 값.
 *
 * 일련번호처럼 사람이 옮겨 적어야 하는 값에 쓴다. 값 자체가 버튼이라
 * 어디를 눌러야 하는지 헷갈릴 일이 없다.
 */
function CopyText({ value, label }: Props) {
  const { copy, isCopied } = useCopy(
    `${label}를 복사하지 못했습니다. 직접 선택해 복사해주세요.`
  );

  return (
    <StyledCopyText
      type="button"
      className={isCopied ? "copied" : ""}
      title={`${label} 복사`}
      aria-label={`${label} ${value} 복사`}
      onClick={() => void copy(value, `${label}를 복사했습니다.`)}
    >
      <code>{value}</code>
      {isCopied ? <FaCheck aria-hidden /> : <FaRegCopy aria-hidden />}
    </StyledCopyText>
  );
}

const StyledCopyText = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;

  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  background: ${({ theme }) => theme.color.blur};
  color: ${({ theme }) => theme.color.text};
  box-shadow: ${({ theme }) => theme.shadow.light};
  cursor: pointer;
  transition: box-shadow 0.2s ease, color 0.2s ease;

  &:hover,
  &:focus-visible {
    box-shadow: ${({ theme }) => theme.shadow.default};
  }

  /* 복사된 순간에는 색으로 알려준다. 문구가 바뀌면 폭이 흔들린다. */
  &.copied {
    color: ${({ theme }) => theme.color.primary};
  }

  code {
    /* 일련번호는 O 와 0 처럼 헷갈리는 글자가 없지만, 옮겨 적기 쉽게 고정폭으로 둔다. */
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: ${({ theme }) => theme.fontSize.small};
    letter-spacing: 0.05em;
  }

  svg {
    flex-shrink: 0;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
  }
`;

export default CopyText;
