import styled from "styled-components";
import { CardEntry, detailEntries, findEntry } from "../../utils/cardUtil";

interface Props {
  entries: CardEntry[];
}

/** 공개 항목만 담긴 명함 본문 */
function CardView({ entries }: Props) {
  const name = findEntry(entries, "name");
  const bio = findEntry(entries, "bio");
  const details = detailEntries(entries);

  return (
    <StyledCardView>
      <header className="card-header">
        <h1 className="card-name">{name?.value ?? "이름 비공개"}</h1>
        {bio && <p className="card-bio">{bio.value}</p>}
      </header>

      {details.length > 0 ? (
        <dl className="card-details">
          {details.map((entry) => (
            <div className="card-detail" key={entry.id}>
              <dt>{entry.label}</dt>
              <dd>{entry.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="card-empty">공개로 설정한 항목이 없습니다.</p>
      )}
    </StyledCardView>
  );
}

const StyledCardView = styled.article`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;

  .card-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-name {
    margin: 0;
    font-size: ${({ theme }) => theme.heading.large.fontSize};
    color: ${({ theme }) => theme.color.primary};
    word-break: keep-all;
  }

  .card-bio {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSize.medium};
    color: ${({ theme }) => theme.color.text};
    line-height: 1.6;
    word-break: keep-all;
  }

  .card-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 0;
  }

  .card-detail {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 1rem;
    align-items: baseline;

    dt {
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
      font-weight: bold;
      color: ${({ theme }) => theme.color.textSecondary};
      word-break: keep-all;
    }

    dd {
      margin: 0;
      font-size: ${({ theme }) => theme.fontSize.small};
      color: ${({ theme }) => theme.color.text};
      line-height: 1.6;
      word-break: break-word;
      user-select: text;
    }
  }

  .card-empty {
    margin: 0;
    color: ${({ theme }) => theme.color.textSecondary};
    font-size: ${({ theme }) => theme.fontSize.small};
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    .card-detail {
      grid-template-columns: 1fr;
      gap: 0.125rem;
    }
  }
`;

export default CardView;
