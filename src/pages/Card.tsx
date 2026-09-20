import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "react-query";
import styled from "styled-components";
import { FaCircleInfo } from "react-icons/fa6";

import { getCard, getCardPhoto } from "../services/card";
import { isFirebaseConfigured } from "../services/firebase";
import CopyText from "../components/common/CopyText";
import CardView from "../components/card/CardView";
import CardShare from "../components/card/CardShare";
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
        <CardShare url={cardUrl} serialNumber={card.serialNumber} />
      </div>

      {card.serialNumber && (
        <p className="card-serial">
          일련번호 <CopyText value={card.serialNumber} label="일련번호" />
        </p>
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

  .card-panel {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2.5rem;
    width: 100%;
    padding: 2.5rem;

    background: ${({ theme }) => theme.color.surface};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    box-shadow: ${({ theme }) => theme.shadow.strong};
  }

  .card-serial {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.textSecondary};
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    .card-panel {
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      padding: 1.5rem;
    }
  }
`;

export default Card;
