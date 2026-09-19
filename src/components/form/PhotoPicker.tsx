import { useRef, useState } from "react";
import styled from "styled-components";
import { FaCamera, FaTrash } from "react-icons/fa";

import {
  ACCEPTED_IMAGE_TYPES,
  fileToPhotoDataUrl,
} from "../../utils/imageUtil";
import Button from "../common/Button";

interface Props {
  /** 줄여서 담은 JPEG 데이터 URL. 없으면 사진 없음 */
  value: string | null;
  onChange: (photo: string | null) => void;
  onError: (message: string) => void;
}

/** 명함에 넣을 사진을 고른다. 고르는 즉시 줄여서 데이터 URL 로 들고 있는다. */
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
      <div className="photo-preview" aria-hidden={!value}>
        {value ? <img src={value} alt="선택한 명함 사진" /> : <FaCamera />}
      </div>

      <div className="photo-actions">
        <Button
          type="button"
          size="small"
          disabled={isProcessing}
          onClick={() => inputRef.current?.click()}
        >
          {value ? "사진 변경" : "사진 추가"}
        </Button>

        {value && (
          <Button
            type="button"
            size="small"
            scheme="blur"
            aria-label="사진 삭제"
            onClick={() => onChange(null)}
          >
            <FaTrash />
          </Button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          hidden
          onChange={handleSelect}
        />
      </div>
    </StyledPhotoPicker>
  );
}

const StyledPhotoPicker = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-left: 1rem;

  .photo-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    width: 4.5rem;
    aspect-ratio: 1;
    overflow: hidden;

    border-radius: 50%;
    background: ${({ theme }) => theme.color.blur};
    box-shadow: ${({ theme }) => theme.shadow.light};
    color: ${({ theme }) => theme.color.textSecondary};

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .photo-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

export default PhotoPicker;
