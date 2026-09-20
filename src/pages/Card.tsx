import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "react-query";
import styled from "styled-components";
import { FaCircleInfo, FaPen } from "react-icons/fa6";

import { RootState } from "../store";
import {
  ensureSerialPointer,
  getCard,
  getCardPhoto,
  getPrivateCard,
} from "../services/card";
import { isFirebaseConfigured } from "../services/firebase";
import { CardFormInitial } from "../hooks/useCardForm";
import Button from "../components/common/Button";
import CardView from "../components/card/CardView";
import CardShare from "../components/card/CardShare";
import DeleteCardButton from "../components/card/DeleteCardButton";
import EditCardModal from "../components/card/EditCardModal";
import FirebaseNotice from "../components/common/FirebaseNotice";
import Loading from "../components/common/Loading";
import Title from "../components/common/Title";

/** 명함 생성 직후 넘어올 때 전달되는 정보 */
interface CardLocationState {
  justCreated?: boolean;
}

function Card() {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation() as { state: CardLocationState | null };
  const user = useSelector((rootState: RootState) => rootState.auth.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [initial, setInitial] = useState<CardFormInitial | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const {
    data: card,
    isLoading,
    isError,
  } = useQuery(["card", id], () => getCard(id as string), {
    enabled: Boolean(id) && isFirebaseConfigured,
    retry: false,
  });

  // 사진은 명함 문서와 따로 저장되어 있어 한 번 더 읽는다.
  const { data: photo } = useQuery(
    ["card-photo", card?.id],
    () => getCardPhoto(card as NonNullable<typeof card>),
    { enabled: Boolean(card?.hasPhoto), retry: false }
  );

  /**
   * 일련번호로 찾아올 수 있게 길잡이를 챙긴다.
   *
   * 길잡이가 생기기 전에 만들어진 명함은 검색되지 않는다. 누군가
   * 한 번 열어보면 그때 채워지므로 손으로 옮길 필요가 없다.
   */
  useEffect(() => {
    if (!card) return;
    void ensureSerialPointer(card);
  }, [card]);

  if (!isFirebaseConfigured) {
    return (
      <StyledCardPage>
        <FirebaseNotice description="명함을 불러오려면 Firebase 연결이 필요합니다." />
      </StyledCardPage>
    );
  }

  if (isLoading) {
    return (
      <StyledCardPage>
        <Loading />
      </StyledCardPage>
    );
  }

  if (isError) {
    return (
      <StyledCardPage>
        <Title size="medium" color="error">
          명함을 불러오지 못했습니다.
        </Title>
        <p className="page-message">잠시 후 다시 시도해주세요.</p>
      </StyledCardPage>
    );
  }

  if (!card) {
    return (
      <StyledCardPage>
        <Title size="medium">존재하지 않는 명함입니다.</Title>
        <p className="page-message">
          주소가 정확한지 확인해주세요. 비회원 명함은 생성 후 1개월이 지나면
          사라집니다.
        </p>
      </StyledCardPage>
    );
  }

  const cardUrl = `${window.location.origin}/cards/${card.id}`;
  // 내 명함이면 이 화면에서 바로 고칠 수 있다.
  const isOwner = Boolean(user?.uid) && card.uid === user?.uid;

  /**
   * 수정 화면에 필요한 것을 모아서 연다.
   *
   * 공개 문서에는 공개 항목만 들어 있어 그대로는 폼을 채울 수 없다.
   * 입력 원본을 따로 읽어야 한다.
   */
  const handleEdit = async () => {
    setIsPreparing(true);

    try {
      const priv = await getPrivateCard(card);
      if (!priv) return;

      setInitial({
        values: priv.values,
        isPublic: priv.isPublic,
        inShuffle: card.inShuffle,
        photo: photo ?? null,
      });
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <StyledCardPage>
      {state?.justCreated && (
        <div className="created-notice" role="status">
          <FaCircleInfo />
          <p>
            명함이 생성되었습니다. 아래 <strong>일련번호</strong>는 명함을 수정하거나
            삭제할 때 필요하니 따로 보관해주세요.
          </p>
        </div>
      )}

      <div className="card-panel">
        <CardView entries={card.entries} photo={photo} />
        <CardShare
          url={cardUrl}
          serialNumber={card.serialNumber}
          actions={
            isOwner && (
              <div className="owner-actions">
                <Button
                  type="button"
                  size="small"
                  scheme="primary"
                  disabled={isPreparing}
                  onClick={() => void handleEdit()}
                >
                  {isPreparing ? <Loading size="small" /> : <FaPen />} 편집
                </Button>
                <DeleteCardButton
                  card={card}
                  onDeleted={() => {
                    void queryClient.invalidateQueries(["my-cards"]);
                    navigate("/mypage", { replace: true });
                  }}
                />
              </div>
            )
          }
        />
      </div>

      {initial && (
        <EditCardModal
          card={card}
          initial={initial}
          onClose={() => setInitial(null)}
          onSaved={() => {
            void queryClient.invalidateQueries(["card", card.id]);
            void queryClient.invalidateQueries(["card-photo", card.id]);
            void queryClient.invalidateQueries(["my-cards"]);
          }}
        />
      )}
    </StyledCardPage>
  );
}

const StyledCardPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;

  .page-message {
    margin: 0;
    color: ${({ theme }) => theme.color.textSecondary};
    text-align: center;
    word-break: keep-all;
  }

  .created-notice {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem 1.5rem;

    background: ${({ theme }) => theme.color.blur};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    box-shadow: ${({ theme }) => theme.shadow.light};

    p {
      margin: 0;
      font-size: ${({ theme }) => theme.fontSize.small};
      line-height: 1.6;
      word-break: keep-all;
    }

    svg {
      flex-shrink: 0;
      color: ${({ theme }) => theme.color.primary};
    }
  }

  /*
   * 위쪽은 두 칸(사람 / 공유), 아래쪽은 한 칸이다.
   *
   * 공유 묶음 옆으로 항목을 세우면 그 아래가 통째로 비어 보인다.
   * 항목은 카드 너비를 다 쓰게 하고, 공유는 위쪽 한 칸만 차지한다.
   */
  .card-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 2rem 2.5rem;
    width: 100%;
    padding: 2.5rem;

    background: ${({ theme }) => theme.color.surface};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    box-shadow: ${({ theme }) => theme.shadow.strong};
  }

  /* 명함 본문은 자기 상자를 두지 않고 바깥 격자에 그대로 놓인다. */
  .card-panel > article {
    display: contents;
  }

  .card-panel .card-header {
    grid-column: 1;
    grid-row: 1;
    /* 옆의 공유 묶음과 높이가 달라도 가운데에서 만나게 한다. */
    align-self: center;
  }

  .card-panel .card-groups {
    grid-column: 1 / -1;
  }

  .card-panel .card-empty {
    grid-column: 1 / -1;
  }

  .card-panel > aside {
    grid-column: 2;
    grid-row: 1;
  }

  .owner-actions {
    display: flex;
    gap: 0.5rem;
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    .card-panel {
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .card-panel > aside {
      grid-column: 1;
      grid-row: auto;
    }
  }
`;

export default Card;
