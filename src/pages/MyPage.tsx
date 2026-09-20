import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import styled from "styled-components";
import { FaChevronRight } from "react-icons/fa6";

import { RootState } from "../store";
import { listMyCards } from "../services/card";
import { isFirebaseConfigured } from "../services/firebase";
import { findEntry } from "../utils/cardUtil";

import DeleteCardButton from "../components/card/DeleteCardButton";
import FirebaseNotice from "../components/common/FirebaseNotice";
import Loading from "../components/common/Loading";
import Title from "../components/common/Title";

const formatDate = (date: Date | null) =>
  date
    ? date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

function MyPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthLoading = useSelector((state: RootState) => state.auth.isLoading);
  const {
    data: cards,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    ["my-cards", user?.uid],
    () => listMyCards(user?.uid as string),
    { enabled: Boolean(user?.uid) && isFirebaseConfigured, retry: false }
  );

  if (!isFirebaseConfigured) {
    return (
      <StyledMyPage>
        <FirebaseNotice description="내 명함을 불러오려면 Firebase 연결이 필요합니다." />
      </StyledMyPage>
    );
  }

  if (isAuthLoading) {
    return (
      <StyledMyPage>
        <Loading />
      </StyledMyPage>
    );
  }

  if (!user) {
    return (
      <StyledMyPage>
        <Title size="medium">로그인이 필요합니다</Title>
        <p className="mypage-hint">
          로그인하면 만든 명함을 모아 보고 고칠 수 있습니다. 오른쪽 위 로그인
          버튼을 눌러주세요.
        </p>
      </StyledMyPage>
    );
  }

  return (
    <StyledMyPage>
      <header className="mypage-header">
        <Title size="medium">내 명함</Title>
        {cards && cards.length > 0 && (
          <span className="mypage-count">{cards.length}장</span>
        )}
      </header>

      {isLoading && <Loading />}

      {isError && (
        <Title size="small" color="error">
          명함을 불러오지 못했습니다.
        </Title>
      )}

      {cards && cards.length === 0 && (
        <div className="mypage-empty">
          <p>아직 만든 명함이 없습니다.</p>
          <Link to="/">홈에서 첫 명함을 만들어보세요.</Link>
        </div>
      )}

      {cards && cards.length > 0 && (
        <ul className="mypage-list">
          {cards.map((card) => {
            const name = findEntry(card.entries, "name")?.value;
            const bio = findEntry(card.entries, "bio")?.value;

            return (
              <li className="mypage-item" key={card.id}>
                {/* 카드 전체가 하나의 이동 버튼이다. */}
                <Link className="item-link" to={`/cards/${card.id}`}>
                  <span className="item-name">{name ?? "이름 비공개"}</span>
                  {bio && <span className="item-bio">{bio}</span>}
                  <span className="item-meta">
                    <span>{card.serialNumber}</span>
                    {card.createdAt && <span>{formatDate(card.createdAt)}</span>}
                    <span>{card.inShuffle ? "셔플 노출" : "셔플 제외"}</span>
                  </span>
                </Link>
                {/* 링크 위에 놓아, 카드를 눌러 이동하는 것과 섞이지 않게 한다. */}
                <div className="item-actions">
                  <DeleteCardButton
                    card={card}
                    iconOnly
                    onDeleted={() => void refetch()}
                  />
                  <FaChevronRight className="item-arrow" aria-hidden />
                </div>
              </li>
            );
          })}
        </ul>
      )}

    </StyledMyPage>
  );
}

const StyledMyPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;

  .mypage-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  .mypage-count,
  .mypage-hint {
    color: ${({ theme }) => theme.color.textSecondary};
    font-size: ${({ theme }) => theme.fontSize.small};
  }

  .mypage-empty {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
    color: ${({ theme }) => theme.color.textSecondary};

    a {
      color: ${({ theme }) => theme.color.primary};
    }
  }

  .mypage-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mypage-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;

    border-radius: ${({ theme }) => theme.borderRadius.default};
    background: ${({ theme }) => theme.color.surface};
    box-shadow: ${({ theme }) => theme.shadow.light};
    transition: box-shadow 0.2s ease, transform 0.2s ease;

    &:hover,
    &:focus-within {
      transform: translateY(-0.1rem);
      box-shadow: ${({ theme }) => theme.shadow.default};
    }
  }

  .item-link {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    /* 긴 자기소개가 오른쪽 버튼을 밀어내지 않도록 한다. */
    min-width: 0;
    padding: 1.25rem 0 1.25rem 1.5rem;
    color: ${({ theme }) => theme.color.text};

    /*
     * 카드 어디를 눌러도 명함으로 간다.
     *
     * 링크를 카드만큼 키우는 대신 덮개를 깐다. 그래야 삭제 버튼을
     * 링크 안에 넣지 않고도 카드 전체가 눌린다. (a 안의 button 은
     * 올바른 마크업이 아니다)
     */
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: ${({ theme }) => theme.borderRadius.default};
    }

    &:focus-visible::after {
      outline: 2px solid ${({ theme }) => theme.color.primary};
      outline-offset: -2px;
    }
  }

  /* 덮개 위로 올려 눌리게 한다. */
  .item-actions {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .item-name {
    font-weight: bold;
  }

  .item-bio {
    font-size: ${({ theme }) => theme.fontSize.small};
    color: ${({ theme }) => theme.color.textSecondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.25rem;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.textSecondary};
  }

  .item-arrow {
    margin-right: 1.5rem;
    color: ${({ theme }) => theme.color.textSecondary};
  }
`;

export default MyPage;
