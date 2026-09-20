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
import { summarizeFields, summarizeGroups } from "../../utils/formValidation";

interface Props {
  fields: IFormField[];
  values: FormValues;
  isPublic: FormVisibility;
  /** 검증이 한 번이라도 돌았는지 판단하는 데 쓴다. */
  errors: FormErrors;
  /** 목차가 따라다닐 스크롤 영역 */
  scrollRef: RefObject<HTMLElement>;
}

/** 스크롤해 간 자리가 제목에 바짝 붙지 않도록 남기는 여백 */
const SCROLL_MARGIN = 12;

/**
 * 폼의 목차.
 *
 * 항목이 서른 개 가까이 되면 지금 어디쯤인지, 무엇이 남았는지 알기
 * 어렵다. 묶음과 그 아래 항목을 펼쳐 보여주고, 눌러서 건너뛸 수 있다.
 */
function FormToc({ fields, values, isPublic, errors, scrollRef }: Props) {
  const groups = collectGroups(fields);
  const groupProgress = summarizeGroups(fields, values, isPublic);
  const fieldProgress = summarizeFields(fields, values, isPublic);
  const [activeIndex, setActiveIndex] = useState(0);

  /*
   * 아직 비었다고 처음부터 붉게 칠하면 시작하자마자 경고판이 된다.
   * 검증이 한 번 걸린 뒤에만, 어디가 막고 있는지 알려준다.
   */
  const isChecked = Object.keys(errors).length > 0;

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

  /** 스크롤 영역 안쪽만 옮긴다. scrollIntoView 는 모달 바깥까지 움직인다. */
  const scrollTo = (target: Element | null | undefined, margin = 0) => {
    const root = scrollRef.current;
    if (!root || !target) return;

    const offset =
      target.getBoundingClientRect().top - root.getBoundingClientRect().top;
    root.scrollTo({ top: root.scrollTop + offset - margin, behavior: "smooth" });
  };

  const jumpToGroup = (index: number) =>
    scrollTo(scrollRef.current?.querySelector(`#${groupAnchorId(index)}`));

  const jumpToField = (id: string) => {
    const input = scrollRef.current?.querySelector(`#${CSS.escape(id)}`);
    // 항목 전체가 보이도록 입력칸이 아니라 그것을 감싼 덩어리로 간다.
    scrollTo(input?.closest(".form-group") ?? input, SCROLL_MARGIN);

    // 바로 입력할 수 있게 둔다. 스크롤은 위에서 이미 맞췄다.
    if (input instanceof HTMLElement) input.focus({ preventScroll: true });
  };

  return (
    <StyledFormToc aria-label="입력 항목 목차">
      <p className="toc-title">작성 항목</p>

      <ol className="toc-list">
        {groups.map((name, index) => {
          const found = groupProgress.find((item) => item.name === name);
          const total = found?.total ?? 0;
          const filled = found?.filled ?? 0;

          return (
            <li className="toc-group" key={name}>
              <button
                type="button"
                className={`toc-item ${index === activeIndex ? "active" : ""}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => jumpToGroup(index)}
              >
                <span className="toc-name">{name}</span>
                <span className="toc-count">
                  {filled}/{total}
                  <span className="visually-hidden"> 항목 작성함</span>
                </span>
              </button>

              <ul className="toc-fields">
                {fieldProgress
                  .filter((field) => field.group === name)
                  .map((field) => {
                    const isDone = field.total > 0 && field.filled === field.total;
                    const hasProblem = isChecked && field.pending > 0;

                    return (
                      <li key={field.id}>
                        <button
                          type="button"
                          className="toc-field"
                          onClick={() => jumpToField(field.id)}
                        >
                          <span
                            className={`toc-mark ${isDone ? "done" : ""} ${
                              hasProblem ? "problem" : ""
                            }`}
                          >
                            {hasProblem ? (
                              <FaExclamation aria-hidden />
                            ) : (
                              isDone && <FaCheck aria-hidden />
                            )}
                          </span>
                          <span className="toc-field-name">{field.label}</span>
                          <span className="visually-hidden">
                            {hasProblem
                              ? "더 채워야 합니다"
                              : isDone
                                ? "작성함"
                                : "비어 있음"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </li>
          );
        })}
      </ol>
    </StyledFormToc>
  );
}

const StyledFormToc = styled.nav`
  display: flex;
  flex-direction: column;
  width: 12rem;
  flex-shrink: 0;
  /* 항목이 많으면 목차가 화면보다 길어진다. 목차만 따로 굴린다. */
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;

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
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .toc-fields {
    display: flex;
    flex-direction: column;
    margin: 0.25rem 0 0 0.6rem;
    padding: 0 0 0 0.65rem;
    list-style: none;
    /* 어느 묶음에 딸린 항목인지 선으로 잇는다. */
    border-left: 1px solid ${({ theme }) => theme.color.secondary};
  }

  .toc-item,
  .toc-field {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    width: 100%;

    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .toc-item {
    padding: 0.4rem 0.6rem;
    border-radius: ${({ theme }) => theme.borderRadius.default};
    color: ${({ theme }) => theme.color.text};
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    font-weight: bold;

    &:hover {
      background: ${({ theme }) => theme.color.blur};
    }

    &.active {
      background: ${({ theme }) => theme.color.secondary};
      color: ${({ theme }) => theme.color.onSecondary};
    }
  }

  .toc-field {
    padding: 0.25rem 0.4rem;
    border-radius: ${({ theme }) => theme.borderRadius.default};
    color: ${({ theme }) => theme.color.textSecondary};
    font-size: ${({ theme }) => theme.fontSize.extraSmall};

    &:hover {
      background: ${({ theme }) => theme.color.blur};
      color: ${({ theme }) => theme.color.text};
    }
  }

  /* 다 채운 항목만 색이 찬다. 남은 곳을 붉게 칠하면 시작부터 경고판이 된다. */
  .toc-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    width: 0.85rem;
    height: 0.85rem;
    border: 1.5px solid ${({ theme }) => theme.color.textSecondary};
    border-radius: 50%;
    font-size: 0.45rem;

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

  .toc-name,
  .toc-field-name {
    flex: 1;
    min-width: 0;
    word-break: keep-all;
  }

  .toc-field-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
