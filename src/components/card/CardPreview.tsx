import styled from "styled-components";
import { FaChevronRight } from "react-icons/fa6";
import { CardEntry, detailEntries, findEntry } from "../../utils/cardUtil";

/** 요약에 늘어놓을 항목 수. 이보다 많으면 몇 개 더 있는지만 알린다. */
const VISIBLE_ENTRIES = 4;

interface Props {
  entries: CardEntry[];
  /** 줄여서 담은 JPEG 데이터 URL. 없으면 첫 글자로 대신한다. */
  photo?: string | null;
}

/**
 * 명함 한 장을 한눈에 보이도록 줄인 모습.
 *
 * 셔플처럼 넘겨보는 자리에서 쓴다. 전부 펼쳐 놓으면 한 장을 읽는 데
 * 시간이 들어, 넘길지 들여다볼지 정하기 어렵다.
 */
function CardPreview({ entries, photo }: Props) {
  const name = findEntry(entries, "name")?.value ?? "이름 비공개";
  const bio = findEntry(entries, "bio")?.value;
  const details = detailEntries(entries);
  const shown = details.slice(0, VISIBLE_ENTRIES);
  const hidden = details.length - shown.length;

  return (
    <StyledCardPreview>
      {photo ? (
        <img className="preview-photo" src={photo} alt="" />
      ) : (
        // 사진이 없어도 자리가 무너지지 않도록 첫 글자를 둔다.
        <span className="preview-photo empty" aria-hidden>
          {[...name][0]}
        </span>
      )}

      <div className="preview-body">
        <p className="preview-name">{name}</p>
        {bio && <p className="preview-bio">{bio}</p>}

        {shown.length > 0 && (
          <ul className="preview-tags">
            {shown.map((entry) => (
              <li key={entry.id}>
                <span className="tag-label">{entry.label}</span>
                <span className="tag-value">{entry.value}</span>
              </li>
            ))}
            {hidden > 0 && <li className="tag-more">+{hidden}</li>}
          </ul>
        )}
      </div>

      <span className="preview-more">
        자세히 <FaChevronRight aria-hidden />
      </span>
    </StyledCardPreview>
  );
}

const StyledCardPreview = styled.article`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  min-width: 0;

  .preview-photo {
    flex-shrink: 0;
    width: 4.5rem;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 50%;
    box-shadow: ${({ theme }) => theme.shadow.light};
  }

  .preview-photo.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.color.secondary};
    color: ${({ theme }) => theme.color.onSecondary};
    font-size: ${({ theme }) => theme.heading.medium.fontSize};
  }

  .preview-body {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
    min-width: 0;
  }

  .preview-name {
    margin: 0;
    font-size: ${({ theme }) => theme.heading.medium.fontSize};
    line-height: 1.2;
    color: ${({ theme }) => theme.color.text};
  }

  /* 한 줄로 자른다. 길다고 카드가 늘어나면 넘겨보기 어려워진다. */
  .preview-bio {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSize.small};
    color: ${({ theme }) => theme.color.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preview-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0.25rem 0 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
      max-width: 100%;
      padding: 0.2rem 0.6rem;

      border-radius: ${({ theme }) => theme.borderRadius.rounded};
      /* blur 는 거의 투명이라 흰 카드 위에서는 알약 모양이 보이지 않는다. */
      background: ${({ theme }) => theme.color.secondary};
      color: ${({ theme }) => theme.color.onSecondary};
      font-size: ${({ theme }) => theme.fontSize.extraSmall};
    }
  }

  .tag-label {
    flex-shrink: 0;
    opacity: 0.7;
  }

  .tag-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: bold;
  }

  .tag-more {
    color: ${({ theme }) => theme.color.textSecondary};
  }

  .preview-more {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.textSecondary};
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    gap: 1rem;

    .preview-photo {
      width: 3.5rem;
    }

    .preview-name {
      font-size: ${({ theme }) => theme.fontSize.medium};
    }

    /* 좁은 곳에서는 글자 없이 화살표만 남긴다. */
    .preview-more {
      font-size: 0;
      gap: 0;

      svg {
        font-size: ${({ theme }) => theme.fontSize.small};
      }
    }
  }
`;

export default CardPreview;
