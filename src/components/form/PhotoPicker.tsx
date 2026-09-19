import { useRef, useState } from "react";
import styled from "styled-components";
import { FaCamera, FaPlus, FaTrash } from "react-icons/fa";

import {
  ACCEPTED_IMAGE_TYPES,
  fileToPhotoDataUrl,
} from "../../utils/imageUtil";
import Loading from "../common/Loading";

interface Props {
  /** 줄여서 담은 JPEG 데이터 URL. 없으면 사진 없음 */
  value: string | null;
  onChange: (photo: string | null) => void;
  onError: (message: string) => void;
}

/**
 * 명함에 넣을 사진을 고른다. 고르는 즉시 줄여서 데이터 URL 로 들고 있는다.
 *
 * 원형 미리보기 자체가 선택 버튼이고, 오른쪽 위 배지가 상태를 알려준다.
 * 사진이 없으면 + 로 추가를 유도하고, 있으면 휴지통으로 삭제를 받는다.
 */
function PhotoPicker({ value, onChange, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    // 같은 파일을 다시 고를 수 있도록 비워둔다.
    event.target.value = "";
    if (!file) return;

    setIsProcessing(true);

    try {
      onChange(await fileToPhotoDataUrl(file));
    } catch (error) {
      console.error("Error reading photo:", error);
      onError(
        error instanceof Error && error.name === "PhotoTooLargeError"
          ? error.message
          : "사진을 불러오지 못했습니다. 다른 이미지를 사용해주세요."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <StyledPhotoPicker>
      <button
        type="button"
        className="photo-button"
        disabled={isProcessing}
        title={value ? "사진 변경" : "사진 추가"}
        aria-label={value ? "사진 변경" : "사진 추가"}
        onClick={() => inputRef.current?.click()}
      >
        {isProcessing ? (
          <Loading size="medium" />
        ) : value ? (
          <img src={value} alt="" />
        ) : (
          <FaCamera className="photo-placeholder" />
        )}
      </button>

      {value ? (
        <button
          type="button"
          className="photo-badge remove"
          title="사진 삭제"
          aria-label="사진 삭제"
          onClick={() => onChange(null)}
        >
          <FaTrash />
        </button>
      ) : (
        <span className="photo-badge" aria-hidden="true">
          <FaPlus />
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        hidden
        onChange={handleSelect}
      />
    </StyledPhotoPicker>
  );
}

const BADGE_SIZE = "1.75rem";

const StyledPhotoPicker = styled.div`
  position: relative;
  width: 5rem;
  flex-shrink: 0;

  .photo-button {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    overflow: hidden;

    border: none;
    border-radius: 50%;
    background: ${({ theme }) => theme.color.blur};
    box-shadow: ${({ theme }) => theme.shadow.light};
    color: ${({ theme }) => theme.color.textSecondary};
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.2s ease;

    &:hover:not(:disabled),
    &:focus-visible {
      transform: translateY(-0.1rem);
      box-shadow: ${({ theme }) => theme.shadow.default};
    }

    &:disabled {
      cursor: default;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      font-size: ${({ theme }) => theme.fontSize.large};
    }
  }

  .photo-badge {
    /*
     * 바깥으로 튀어나오게 두면 스크롤 영역(.form-content)의 overflow 에
     * 잘린다. 원형의 모서리 여백 안에 들어오도록 붙여둔다.
     */
    position: absolute;
    top: 0;
    right: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    width: ${BADGE_SIZE};
    height: ${BADGE_SIZE};
    padding: 0;

    border: none;
    border-radius: 50%;
    background: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.onPrimary};
    box-shadow: ${({ theme }) => theme.shadow.light};
    pointer-events: none;

    svg {
      width: 55%;
      height: 55%;
    }

    /* 삭제는 실제로 누를 수 있어야 한다. */
    &.remove {
      pointer-events: auto;
      cursor: pointer;
      background: ${({ theme }) => theme.color.error};
      color: ${({ theme }) => theme.color.onError};

      &:hover,
      &:focus-visible {
        box-shadow: ${({ theme }) => theme.shadow.default};
      }
    }
  }
`;

export default PhotoPicker;
