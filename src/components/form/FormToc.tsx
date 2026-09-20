import { RefObject, useEffect, useState } from "react";
import styled from "styled-components";
import { FaCheck, FaExclamation } from "react-icons/fa6";

import {
  FormErrors,
  FormValues,
  FormVisibility,
  IFormField,
} from "../../types/formType";
import { collectGroups, groupAnchorId } from "../../utils/formUtil";
import { summarizeGroups } from "../../utils/formValidation";

interface Props {
  fields: IFormField[];
  values: FormValues;
  isPublic: FormVisibility;
  /** 검증이 한 번이라도 돌았는지 판단하는 데 쓴다. */
  errors: FormErrors;
  /** 목차가 따라다닐 스크롤 영역 */
  scrollRef: RefObject<HTMLElement>;
}

/**
 * 폼의 묶음 목차.
 *
 * 항목이 서른 개 가까이 되면 지금 어디쯤인지, 무엇이 남았는지 알기
 * 어렵다. 눌러서 건너뛸 수 있고, 묶음마다 얼마나 채웠는지 보여준다.
 */
function FormToc({ fields, values, isPublic, errors, scrollRef }: Props) {
  const groups = collectGroups(fields);
  const progress = summarizeGroups(fields, values, isPublic);

  /*
   * 아직 비었다고 처음부터 붉게 칠하면 시작하자마자 경고판이 된다.
   * 검증이 한 번 걸린 뒤에만, 어느 묶음이 막고 있는지 알려준다.
   */
  const isChecked = Object.keys(errors).length > 0;
  const [activeIndex, setActiveIndex] = useState(0);

  /**
   * 화면에 보이는 묶음을 따라간다.
   *
   * 스크롤 위치로 직접 계산하지 않고 제목이 보이는지로 판단한다.
   * 항목 높이가 제각각이라 위치로 어림하면 어긋난다.
   */
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const titles = groups
      .map((_, index) => root.querySelector(`#${groupAnchorId(index)}`))
      .filter((element): element is Element => Boolean(element));

    if (titles.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        const top = visible.reduce((best, entry) =>
          entry.boundingClientRect.top < best.boundingClientRect.top ? entry : best
        );
        setActiveIndex(titles.indexOf(top.target));
      },
      // 위쪽 절반에 들어온 제목을 현재 묶음으로 본다.
      { root, rootMargin: "0px 0px -50% 0px", threshold: 0 }
    );

    titles.forEach((title) => observer.observe(title));
    return () => observer.disconnect();
    // 묶음이 늘거나 줄면(추가 항목) 다시 건다.
  }, [scrollRef, groups.length, groups]);

  const jumpTo = (index: number) => {
    const root = scrollRef.current;
    const title = root?.querySelector(`#${groupAnchorId(index)}`);
    if (!root || !title) return;

    // scrollIntoView 는 모달 바깥까지 움직인다. 안쪽만 옮긴다.
    const offset =
      title.getBoundingClientRect().top - root.getBoundingClientRect().top;
    root.scrollTo({ top: root.scrollTop + offset, behavior: "smooth" });
  };

  return (
    <StyledFormToc aria-label="입력 항목 목차">
      <p className="toc-title">작성 항목</p>

      <ol className="toc-list">
        {groups.map((name, index) => {
          const found = progress.find((item) => item.name === name);
          const total = found?.total ?? 0;
          const filled = found?.filled ?? 0;
          /*
           * 다 채웠을 때만 표시한다.
           *
           * "필수가 남지 않았다" 를 기준으로 삼으면, 선택 항목뿐인
           * 묶음은 하나만 적어도 완료로 보여 1/3 옆에 체크가 붙는다.
           */
          const isDone = total > 0 && filled === total;
          const hasProblem = isChecked && (found?.pending ?? 0) > 0;

          return (
            <li key={name}>
              <button
                type="button"
                className={`toc-item ${index === activeIndex ? "active" : ""}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => jumpTo(index)}
              >
                <span
                  className={`toc-mark ${isDone ? "done" : ""} ${hasProblem ? "problem" : ""}`}
                >
                  {isDone && <FaCheck aria-hidden />}
                  {hasProblem && <FaExclamation aria-hidden />}
                </span>
                <span className="toc-name">{name}</span>
                <span className="toc-count">
                  {filled}/{total}
                  <span className="visually-hidden">
                    {hasProblem
                      ? " 항목 작성함, 더 채워야 합니다"
                      : isDone
                        ? " 항목 모두 작성함"
                        : " 항목 작성함"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </StyledFormToc>
  );
}

const StyledFormToc = styled.nav`
  position: sticky;
  top: 0;
  align-self: start;
  width: 11rem;
  flex-shrink: 0;

  .toc-title {
    margin: 0 0 0.75rem;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    font-weight: bold;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.color.textSecondary};
  }

  .toc-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .toc-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.75rem;

    border: none;
    border-radius: ${({ theme }) => theme.borderRadius.default};
    background: transparent;
    color: ${({ theme }) => theme.color.textSecondary};
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;

    &:hover {
      background: ${({ theme }) => theme.color.blur};
      color: ${({ theme }) => theme.color.text};
    }

    &.active {
      background: ${({ theme }) => theme.color.secondary};
      color: ${({ theme }) => theme.color.onSecondary};
      font-weight: bold;
    }
  }

  /* 다 채운 묶음만 색이 찬다. 남은 곳을 붉게 칠하면 시작부터 경고판이 된다. */
  .toc-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    width: 1.1rem;
    height: 1.1rem;
    border: 1.5px solid ${({ theme }) => theme.color.textSecondary};
    border-radius: 50%;
    font-size: 0.55rem;

    &.done {
      border-color: ${({ theme }) => theme.color.primary};
      background: ${({ theme }) => theme.color.primary};
      color: ${({ theme }) => theme.color.onPrimary};
    }

    &.problem {
      border-color: ${({ theme }) => theme.color.error};
      background: ${({ theme }) => theme.color.error};
      color: ${({ theme }) => theme.color.onError};
    }
  }

  .toc-name {
    flex: 1;
    min-width: 0;
    word-break: keep-all;
  }

  .toc-count {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    opacity: 0.8;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

export default FormToc;
