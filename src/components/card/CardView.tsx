import styled from "styled-components";
import { CardEntry, detailEntries, findEntry, groupEntries } from "../../utils/cardUtil";

interface Props {
  entries: CardEntry[];
  /** 줄여서 담은 JPEG 데이터 URL. 없으면 사진 자리를 비운다. */
  photo?: string | null;
}

/** 이 폭을 넘는 값은 한 칸에 가두면 어색하게 접힌다. (영문 글자 기준) */
const WIDE_VALUE_WIDTH = 24;

/**
 * 값이 차지하는 가로 폭을 어림한다.
 *
 * 글자 수로만 재면 한글이 불리하다. 같은 열 개 글자라도 한글은
 * 영문의 두 배 가까이 차지한다.
 */
const estimateWidth = (value: string): number =>
  [...value].reduce(
    (total, char) => total + (/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(char) ? 2 : 1),
    0
  );

/** 공개 항목만 담긴 명함 본문 */
function CardView({ entries, photo }: Props) {
  const name = findEntry(entries, "name");
  const bio = findEntry(entries, "bio");
  const groups = groupEntries(detailEntries(entries));

  // 묶음이 하나뿐이면 제목이 정보를 더해주지 않는다. 그냥 늘어놓는다.
  const showsGroupName = groups.length > 1;

  return (
    <StyledCardView>
      <header className="card-header">
        {photo && <img className="card-photo" src={photo} alt="명함 사진" />}

        <div className="card-heading">
          <h1 className="card-name">{name?.value ?? "이름 비공개"}</h1>
          {bio && <p className="card-bio">{bio.value}</p>}
        </div>
      </header>

      {groups.length > 0 ? (
        <div className="card-groups">
          {groups.map((group) => (
            <section className="card-group" key={group.name}>
              {showsGroupName && <h2 className="card-group-name">{group.name}</h2>}

              <dl className="card-details">
                {group.entries.map((entry) => (
                  <div
                    className={
                      estimateWidth(entry.value) > WIDE_VALUE_WIDTH
                        ? "card-detail wide"
                        : "card-detail"
                    }
                    key={entry.id}
                  >
                    <dt>{entry.label}</dt>
                    <dd>{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      ) : (
        <p className="card-empty">공개로 설정한 항목이 없습니다.</p>
      )}
    </StyledCardView>
  );
}

const StyledCardView = styled.article`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  width: 100%;
  min-width: 0;

  .card-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
    min-width: 0;
  }

  .card-photo {
    flex-shrink: 0;
    width: 6.5rem;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 50%;
    box-shadow: ${({ theme }) => theme.shadow.default};
  }

  .card-heading {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  .card-name {
    margin: 0;
    font-size: ${({ theme }) => theme.heading.large.fontSize};
    line-height: 1.2;
    color: ${({ theme }) => theme.color.text};
    word-break: keep-all;
  }

  .card-bio {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSize.medium};
    color: ${({ theme }) => theme.color.primary};
    line-height: 1.5;
    word-break: keep-all;
  }

  .card-groups {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    padding-top: 1.75rem;
    border-top: 1px solid ${({ theme }) => theme.color.secondary};
  }

  .card-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .card-group-name {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    font-weight: bold;
    letter-spacing: 0.08em;
    color: ${({ theme }) => theme.color.primary};
  }

  /*
   * 항목을 흐르게 둔다. 너비가 남으면 두 칸, 세 칸으로 나뉘어
   * 오른쪽이 휑하게 비지 않는다.
   *
   * auto-fill 이다. auto-fit 은 빈 칸을 접어버려서, 항목이 둘뿐인
   * 묶음만 칸이 넓어지고 위아래 묶음과 세로줄이 어긋난다.
   */
  .card-details {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: 0.875rem 1.5rem;
    margin: 0;
  }

  /* 이름 위에 값. 사이를 건너뛰며 읽지 않아도 된다. */
  .card-detail {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;

    dt {
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
      color: ${({ theme }) => theme.color.textSecondary};
      word-break: keep-all;
    }

    dd {
      margin: 0;
      font-size: ${({ theme }) => theme.fontSize.small};
      color: ${({ theme }) => theme.color.text};
      line-height: 1.5;
      word-break: break-word;
      user-select: text;
    }
  }

  /*
   * 이메일이나 긴 문장은 두 칸을 쓴다. 한 칸에 가두면 단어 중간에서
   * 접혀 읽기 어렵다. 칸이 하나뿐인 좁은 화면에서는 적용하지 않는다.
   */
  @media screen and ${({ theme }) => theme.mediaQuery.desktop} {
    .card-detail.wide {
      grid-column: span 2;
    }
  }

  .card-empty {
    margin: 0;
    color: ${({ theme }) => theme.color.textSecondary};
    font-size: ${({ theme }) => theme.fontSize.small};
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    gap: 1.5rem;

    .card-header {
      gap: 1rem;
      padding-bottom: 1.25rem;
    }

    .card-photo {
      width: 5rem;
    }

    .card-name {
      font-size: ${({ theme }) => theme.heading.medium.fontSize};
    }

    .card-bio {
      font-size: ${({ theme }) => theme.fontSize.small};
    }
  }
`;

export default CardView;
