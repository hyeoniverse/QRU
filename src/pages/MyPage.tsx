import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import styled from "styled-components";
import { FaEye, FaPen } from "react-icons/fa6";

import { RootState } from "../store";
import { getCardPhoto, getPrivateCard, listMyCards } from "../services/card";
import { isFirebaseConfigured } from "../services/firebase";
import { CardDocument } from "../types/cardType";
import { CardFormInitial } from "../hooks/useCardForm";
import { findEntry } from "../utils/cardUtil";

import Button from "../components/common/Button";
import FirebaseNotice from "../components/common/FirebaseNotice";
import Loading from "../components/common/Loading";
import Title from "../components/common/Title";
import EditCardModal from "../components/mypage/EditCardModal";

/** 수정 화면을 열기 위해 함께 불러와야 하는 것 */
interface Editing {
  card: CardDocument;
  initial: CardFormInitial;
}

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
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<Editing | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const {
    data: cards,
    isLoading,
    isError,
  } = useQuery(
    ["my-cards", user?.uid],
    () => listMyCards(user?.uid as string),
    { enabled: Boolean(user?.uid) && isFirebaseConfigured, retry: false }
  );

  /**
   * 수정 화면에 필요한 것을 모아서 연다.
   *
   * 공개 문서에는 공개 항목만 들어 있어 그대로는 폼을 채울 수 없다.
   * 입력 원본과 사진을 따로 읽어야 한다.
   */
  const handleEdit = async (card: CardDocument) => {
    setLoadingId(card.id);

    try {
      const [priv, photo] = await Promise.all([
        getPrivateCard(card),
        getCardPhoto(card),
      ]);
      if (!priv) return;

      setEditing({
        card,
        initial: {
          values: priv.values,
          isPublic: priv.isPublic,
          inShuffle: card.inShuffle,
          photo,
        },
      });
    } finally {
      setLoadingId(null);
    }
  };

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
                <div className="item-summary">
                  <p className="item-name">{name ?? "이름 비공개"}</p>
                  {bio && <p className="item-bio">{bio}</p>}
                  <p className="item-meta">
                    <span>{card.serialNumber}</span>
                    {card.createdAt && <span>{formatDate(card.createdAt)}</span>}
                    <span>{card.inShuffle ? "셔플 노출" : "셔플 제외"}</span>
                  </p>
                </div>

                <div className="item-buttons">
                  <Link to={`/cards/${card.id}`} className="item-link">
                    <FaEye /> 보기
                  </Link>
                  <Button
                    type="button"
                    size="small"
                    disabled={loadingId === card.id}
                    onClick={() => void handleEdit(card)}
                  >
                    <FaPen /> 수정
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <EditCardModal
          card={editing.card}
          initial={editing.initial}
          onClose={() => setEditing(null)}
          onChanged={() => {
            void queryClient.invalidateQueries(["my-cards", user.uid]);
            void queryClient.invalidateQueries(["card", editing.card.id]);
            void queryClient.invalidateQueries(["card-photo", editing.card.id]);
          }}
        />
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    border-radius: ${({ theme }) => theme.borderRadius.default};
    background: ${({ theme }) => theme.color.surface};
    box-shadow: ${({ theme }) => theme.shadow.light};
  }

  .item-summary {
    /* 긴 자기소개가 버튼을 밀어내지 않도록 한다. */
    min-width: 0;
  }

  .item-name {
    margin: 0;
    font-weight: bold;
  }

  .item-bio {
    margin: 0.25rem 0 0;
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
    margin: 0.5rem 0 0;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.textSecondary};
  }

  .item-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .item-link {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: ${({ theme }) => theme.fontSize.small};
    color: ${({ theme }) => theme.color.text};
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    .mypage-item {
      flex-direction: column;
      align-items: stretch;
    }

    .item-buttons {
      justify-content: flex-end;
    }
  }
`;

export default MyPage;
