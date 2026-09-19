import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaShuffle } from "react-icons/fa6";

import { FORM_FIELDS } from "../data/formFields";
import { fetchRandomCard } from "../services/card";
import { isFirebaseConfigured } from "../services/firebase";
import { CardDocument } from "../types/cardType";
import { IOption } from "../types/formType";
import { SHUFFLE_FILTER_IDS, ShuffleFilters } from "../utils/cardUtil";

import Button from "../components/common/Button";
import FirebaseNotice from "../components/common/FirebaseNotice";
import InputSelect from "../components/common/InputSelect";
import Loading from "../components/common/Loading";
import Title from "../components/common/Title";
import CardView from "../components/card/CardView";

const ALL = "";

/** 필터로 쓸 항목의 라벨과 선택지를 기존 폼 정의에서 그대로 가져온다. */
const FILTERS = SHUFFLE_FILTER_IDS.map((id) => {
  const field = FORM_FIELDS.find((item) => item.id === id);

  return {
    id,
    label: field?.label ?? id,
    options: [
      { label: "전체", value: ALL },
      ...(field?.options ?? []),
    ] as IOption[],
  };
});

type Status = "idle" | "loading" | "empty" | "error";

function Shuffle() {
  const [filters, setFilters] = useState<ShuffleFilters>({});
  const [card, setCard] = useState<CardDocument | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  // 직전에 본 명함을 피하려고 들고 있는다. 렌더링과 무관하므로 ref 를 쓴다.
  const lastIdRef = useRef<string | undefined>(undefined);

  const shuffle = useCallback(async (next: ShuffleFilters) => {
    setStatus("loading");

    try {
      const found = await fetchRandomCard(next, lastIdRef.current);

      if (!found) {
        setCard(null);
        setStatus("empty");
        return;
      }

      lastIdRef.current = found.id;
      setCard(found);
      setStatus("idle");
    } catch (error) {
      console.error("Error shuffling cards:", error);
      setStatus("error");
    }
  }, []);

  // 조건을 바꾸면 이전 결과를 남겨두지 않고 바로 다시 뽑는다.
  const changeFilter = (id: string, value: string) => {
    const next = { ...filters, [id]: value || undefined };
    setFilters(next);
    lastIdRef.current = undefined;
    void shuffle(next);
  };

  useEffect(() => {
    if (isFirebaseConfigured) void shuffle({});
  }, [shuffle]);

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

      <div className="shuffle-filters">
        {FILTERS.map((filter) => (
          <div className="shuffle-filter" key={filter.id}>
            <label htmlFor={`filter-${filter.id}`}>{filter.label}</label>
            <InputSelect
              id={`filter-${filter.id}`}
              name={filter.id}
              value={filters[filter.id] ?? ALL}
              options={filter.options}
              placeholder="전체"
              onChange={(value) => changeFilter(filter.id, value)}
            />
          </div>
        ))}
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
            <CardView entries={card.entries} />
          </Link>
        )}
      </div>

      <Button
        type="button"
        size="large"
        scheme="primary"
        disabled={status === "loading"}
        onClick={() => void shuffle(filters)}
      >
        <FaShuffle /> 다시 셔플
      </Button>
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

  .shuffle-filters {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .shuffle-filter {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 10rem;

    label {
      margin-left: 0.5rem;
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
      color: ${({ theme }) => theme.color.text};
    }
  }

  .shuffle-result {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 16rem;
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
    padding: 2.5rem;

    background: ${({ theme }) => theme.color.surface};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    box-shadow: ${({ theme }) => theme.shadow.strong};
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
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
