import { useRef, useState } from "react";
import styled from "styled-components";
import { FaCamera, FaPlus, FaTrash } from "react-icons/fa";

import { ACCEPTED_IMAGE_TYPES, fileToDataUrl } from "../../utils/imageUtil";
import Loading from "../common/Loading";
import PhotoEditor from "./PhotoEditor";

interface Props {
  /** 줄여서 담은 JPEG 데이터 URL. 없으면 사진 없음 */
  value: string | null;
  onChange: (photo: string | null) => void;
  onError: (message: string) => void;
}

/**
 * 명함에 넣을 사진을 고르고 다듬는다.
 *
 * 원형 미리보기 자체가 버튼이다. 사진이 없으면 고르러 가고, 있으면
 * 편집기를 열어 위치와 크기를 다시 잡는다. 오른쪽 위 배지가 상태를
 * 알려준다. 비어 있으면 +, 채워져 있으면 삭제다.
 */
function PhotoPicker({ value, onChange, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);
  /** 편집기에 올려둔 사진. 열려 있는 동안만 들고 있는다. */
  const [editing, setEditing] = useState<string | null>(null);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    // 같은 파일을 다시 고를 수 있도록 비워둔다.
    event.target.value = "";
    if (!file) return;

    setIsReading(true);

    try {
      setEditing(await fileToDataUrl(file));
    } catch (error) {
      console.error("Error reading photo:", error);
      onError("사진을 불러오지 못했습니다. 다른 이미지를 사용해주세요.");
    } finally {
      setIsReading(false);
    }
  };

  // 이미 넣어둔 사진은 그것을 그대로 편집기에 올린다.
  const handleOpen = () => {
    if (value) setEditing(value);
    else inputRef.current?.click();
  };

  return (
    <StyledPhotoPicker>
      <button
        type="button"
        className="photo-button"
        disabled={isReading}
        title={value ? "사진 편집" : "사진 추가"}
        aria-label={value ? "사진 편집" : "사진 추가"}
        onClick={handleOpen}
      >
        {isReading ? (
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

      {editing && (
        <PhotoEditor
          source={editing}
          onApply={(photo) => {
            onChange(photo);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
          onPickAnother={() => inputRef.current?.click()}
          onError={onError}
        />
      )}
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
