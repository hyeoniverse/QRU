import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaShuffle } from "react-icons/fa6";

import { FORM_FIELDS } from "../data/formFields";
import {
  CardSearchCriteria,
  fetchRandomCard,
  getCardPhoto,
} from "../services/card";
import { isFirebaseConfigured } from "../services/firebase";
import { CardDocument } from "../types/cardType";
import { labelSearchKey } from "../utils/cardUtil";
import { SELF_VALUE } from "../utils/formUtil";
import { IOption } from "../types/formType";

import Button from "../components/common/Button";
import FirebaseNotice from "../components/common/FirebaseNotice";
import InputSelect from "../components/common/InputSelect";
import InputText from "../components/common/InputText";
import Loading from "../components/common/Loading";
import Title from "../components/common/Title";
import CardPreview from "../components/card/CardPreview";

const ALL = "";

/**
 * 항목 id 와 색인 키가 다른 경우.
 * SNS 는 종류가 하위 항목(sns_id)의 라벨에 담기므로 그쪽을 본다.
 */
const FILTER_SEARCH_KEY: Record<string, string> = {
  sns: labelSearchKey("sns_id"),
};

/**
 * 선택지가 정해진 항목은 그대로 드롭다운 필터가 된다.
 * 폼 정의에서 뽑아오므로 항목이 늘면 필터도 같이 늘어난다.
 *
 * 검색 색인에는 화면에 보이는 라벨("여성")이 저장되므로, 필터도 원본
 * 값("female")이 아니라 라벨을 넘겨야 맞는다. 자유 검색어와 기준이
 * 같아지는 장점도 있다.
 */

const FILTERS = FORM_FIELDS.filter(
  (field) => field.type === "select" && field.options?.length
).map((field) => ({
  id: field.id,
  searchKey: FILTER_SEARCH_KEY[field.id] ?? field.id,
  label: field.label,
  options: [
    { label: "전체", value: ALL },
    ...(field.options ?? [])
      .filter((option) => option.value !== SELF_VALUE)
      .map((option) => ({ label: option.label, value: option.label })),
  ] as IOption[],
}));

type Status = "idle" | "loading" | "empty" | "error";

/** 검색어를 한 글자씩 칠 때마다 질의하지 않도록 기다리는 시간 */
const SEARCH_DEBOUNCE_MS = 300;

function Shuffle() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [card, setCard] = useState<CardDocument | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  // 직전에 본 명함을 피하려고 들고 있는다. 렌더링과 무관하므로 ref 를 쓴다.
  const lastIdRef = useRef<string | undefined>(undefined);

  const shuffle = useCallback(async (criteria: CardSearchCriteria) => {
    setStatus("loading");

    try {
      const found = await fetchRandomCard(criteria, lastIdRef.current);

      if (!found) {
        setCard(null);
        setPhoto(null);
        setStatus("empty");
        return;
      }

      lastIdRef.current = found.id;
      setCard(found);
      setStatus("idle");

      // 사진은 보여줄 한 장에 대해서만 읽는다.
      setPhoto(found.hasPhoto ? await getCardPhoto(found) : null);
    } catch (error) {
      console.error("Error shuffling cards:", error);
      setStatus("error");
    }
  }, []);

  // 조건이 바뀌면 이전 결과를 남겨두지 않고 다시 뽑는다.
  // 검색어는 타이핑 중 매번 질의하지 않도록 잠깐 기다린다.
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const timer = setTimeout(() => {
      lastIdRef.current = undefined;
      void shuffle({ filters, text });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [filters, text, shuffle]);

  const changeFilter = (id: string, value: string) =>
    setFilters((current) => ({ ...current, [id]: value }));

  const hasCriteria = text.trim() !== "" || Object.values(filters).some(Boolean);

  const resetCriteria = () => {
    setFilters({});
    setText("");
  };

  if (!isFirebaseConfigured) {
    return (
      <StyledShuffle>
        <FirebaseNotice description="명함을 찾으려면 Firebase 연결이 필요합니다." />
      </StyledShuffle>
    );
  }

  return (
    <StyledShuffle>
      <header className="shuffle-header">
        <Title size="medium">명함 찾기</Title>
        <p className="shuffle-description">
          랜덤 셔플에 노출을 허용한 명함 중 한 장을 보여줍니다.
        </p>
      </header>

      <div className="shuffle-criteria">
        <div className="shuffle-filter search">
          <label htmlFor="filter-text">검색어</label>
          <InputText
            id="filter-text"
            value={text}
            placeholder="이름, 취미, 한마디 등 아무 항목이나 입력하세요"
            onChange={(event) => setText(event.target.value)}
          />
        </div>

        {FILTERS.map((filter) => (
          <div className="shuffle-filter" key={filter.id}>
            <label htmlFor={`filter-${filter.id}`}>{filter.label}</label>
            <InputSelect
              id={`filter-${filter.id}`}
              name={filter.id}
              value={filters[filter.searchKey] ?? ALL}
              options={filter.options}
              placeholder="전체"
              onChange={(value) => changeFilter(filter.searchKey, value)}
            />
          </div>
        ))}

        {/*
          * 조건이 없을 때도 자리를 지킨다.
          *
          * 글자를 치는 순간 버튼이 나타나면 줄 전체가 다시 배치되어
          * 검색창 폭이 바뀐다. 쓰는 중에 입력칸이 움직이면 거슬린다.
          */}
        <Button
          type="button"
          size="small"
          className="reset-criteria"
          disabled={!hasCriteria}
          onClick={resetCriteria}
        >
          조건 초기화
        </Button>
      </div>

      <div className="shuffle-result">
        {status === "loading" && <Loading />}

        {status === "error" && (
          <p className="shuffle-message">
            명함을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
        )}

        {status === "empty" && (
          <p className="shuffle-message">
            조건에 맞는 명함이 아직 없습니다. 조건을 바꾸거나 직접 명함을
            만들어보세요.
          </p>
        )}

        {status === "idle" && card && (
          <Link className="shuffle-card" to={`/cards/${card.id}`}>
            <CardPreview entries={card.entries} photo={photo} />
          </Link>
        )}
      </div>

      {/* 이 화면에서 가장 많이 누르는 것이라 늘 손 닿는 곳에 둔다. */}
      <div className="shuffle-action">
        <Button
          type="button"
          size="medium"
          scheme="primary"
          disabled={status === "loading"}
          aria-label="다시 셔플"
          onClick={() => void shuffle({ filters, text })}
        >
          <FaShuffle />
          <span>셔플</span>
        </Button>
      </div>
    </StyledShuffle>
  );
}

const StyledShuffle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;

  .shuffle-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  .shuffle-description {
    margin: 0;
    color: ${({ theme }) => theme.color.textSecondary};
    font-size: ${({ theme }) => theme.fontSize.small};
    word-break: keep-all;
  }

  .shuffle-criteria {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-end;
    gap: 1rem;
    width: 100%;
  }

  .shuffle-filter {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 10rem;

    &.search {
      flex: 1 1 18rem;
      max-width: 28rem;
    }

    label {
      margin-left: 0.5rem;
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
      color: ${({ theme }) => theme.color.text};
    }
  }

  .reset-criteria {
    align-self: flex-end;
  }

  .shuffle-result {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    /* 한 장씩 넘겨보는 자리라 높이가 들쭉날쭉하면 눈이 따라가기 힘들다. */
    min-height: 11rem;
  }

  /*
   * 셔플 버튼은 오른쪽 아래에 떠 있다.
   *
   * 이 화면에서 가장 많이 누르는 것이라, 아래로 내려가도 늘 손 닿는
   * 곳에 있어야 한다. 가운데에 두면 본문 위를 가로질러 읽는 것을
   * 방해하므로 모서리로 비켜둔다.
   */
  padding-bottom: 4rem;

  .shuffle-action {
    position: fixed;
    right: 1.5rem;
    bottom: 1.5rem;
    z-index: 10;

    button {
      gap: 0.5rem;
      box-shadow: ${({ theme }) => theme.shadow.strong};
    }
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    .shuffle-action {
      right: 1rem;
      bottom: 1rem;
    }
  }

  .shuffle-message {
    margin: 0;
    color: ${({ theme }) => theme.color.textSecondary};
    text-align: center;
    word-break: keep-all;
  }

  .shuffle-card {
    display: block;
    width: 100%;
    padding: 1.5rem 1.75rem;

    background: ${({ theme }) => theme.color.surface};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    /*
     * 평소에는 바닥에 놓여 있고, 가리켰을 때 떠오른다.
     * 반대로 두면 기본 상태가 이미 떠 있는 것처럼 보이고,
     * 가리키면 오히려 가라앉는 것처럼 보인다.
     */
    box-shadow: ${({ theme }) => theme.shadow.light};
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover,
    &:focus-visible {
      transform: translateY(-0.2rem);
      box-shadow: ${({ theme }) => theme.shadow.hover};
    }
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    .shuffle-card {
      padding: 1.5rem;
    }
  }
`;

export default Shuffle;
