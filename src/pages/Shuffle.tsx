import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { FaShuffle } from "react-icons/fa6";

import { FORM_FIELDS } from "../data/formFields";
import {
  CardSearchCriteria,
  fetchRandomCards,
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
import ShuffleCard from "../components/card/ShuffleCard";

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
/** 한 번에 보여줄 명함 수 */
const SHUFFLE_COUNT = 5;

const SEARCH_DEBOUNCE_MS = 300;

function Shuffle() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [cards, setCards] = useState<CardDocument[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  // 직전에 보여준 명함을 뒤로 미루려고 들고 있다. 렌더링과 무관해 ref 를 쓴다.
  const lastIdsRef = useRef<string[]>([]);

  const shuffle = useCallback(async (criteria: CardSearchCriteria) => {
    setStatus("loading");

    try {
      const found = await fetchRandomCards(criteria, SHUFFLE_COUNT, lastIdsRef.current);

      lastIdsRef.current = found.map((item) => item.id);
      setCards(found);
      setStatus(found.length === 0 ? "empty" : "idle");
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
      lastIdsRef.current = [];
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
          노출을 허용한 명함 중 다섯 장을 무작위로 보여줍니다. 조건을 좁히거나
          셔플을 눌러 다른 사람을 찾아보세요.
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

        {status === "idle" && cards.length > 0 && (
          <ul className="shuffle-list">
            {cards.map((found) => (
              <ShuffleCard key={found.id} card={found} />
            ))}
          </ul>
        )}
      </div>

      {/* 이 화면에서 가장 많이 누르는 것이라 늘 손 닿는 곳에 둔다. */}
      <div className="shuffle-action">
        <Button
          type="button"
          size="medium"
          scheme="primary"
          disabled={status === "loading"}
          title="다시 셔플"
          aria-label="다시 셔플"
          onClick={() => void shuffle({ filters, text })}
        >
          <FaShuffle />
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

  /* 아래 조건과 목록이 모두 왼쪽에서 시작하므로 제목도 같은 줄에 맞춘다. */
  .shuffle-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    width: 100%;
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
    justify-content: flex-start;
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
    /* 결과가 없을 때도 자리가 무너지지 않게 최소 높이를 둔다. */
    min-height: 11rem;
  }

  .shuffle-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
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

    /* 아이콘 하나만 담은 동그란 버튼. 글자가 없어 이름을 따로 둔다. */
    button {
      width: 3.5rem;
      height: 3.5rem;
      padding: 0;
      border-radius: 50%;
      box-shadow: ${({ theme }) => theme.shadow.strong};

      svg {
        font-size: ${({ theme }) => theme.fontSize.medium};
      }
    }
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    .shuffle-action {
      right: 1rem;
      bottom: 1rem;

      button {
        width: 3.25rem;
        height: 3.25rem;
      }
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
