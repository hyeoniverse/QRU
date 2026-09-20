import { useRef } from "react";
import styled from "styled-components";
import { QRCodeCanvas } from "qrcode.react";
import { FaCheck, FaDownload, FaLink } from "react-icons/fa";
import { useCopy } from "../../hooks/useCopy";
import Button from "../common/Button";

interface Props {
  url: string;
  serialNumber: string;
}

const QR_SIZE = 180;

/** QR 코드를 스캔 가능한 대비로 유지하기 위해 테마와 무관하게 고정한다. */
const QR_BACKGROUND = "#ffffff";
const QR_FOREGROUND = "#213c48";

function CardShare({ url, serialNumber }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { copy, isCopied } = useCopy(
    "링크 복사에 실패했습니다. 주소창의 URL 을 사용해주세요."
  );

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qru-${serialNumber}.png`;
    link.click();
  };


  return (
    <StyledCardShare>
      <div className="qr-box">
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={QR_SIZE}
          bgColor={QR_BACKGROUND}
          fgColor={QR_FOREGROUND}
          level="Q"
          marginSize={2}
        />
      </div>

      <div className="share-actions">
        <Button type="button" size="small" onClick={handleDownload}>
          <FaDownload /> QR 저장
        </Button>
        <Button
          type="button"
          size="small"
          onClick={() => void copy(url, "명함 링크를 복사했습니다.")}
        >
          {isCopied ? <FaCheck /> : <FaLink />} 링크 복사
        </Button>
      </div>
    </StyledCardShare>
  );
}

const StyledCardShare = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;

  .qr-box {
    display: flex;
    padding: 0.75rem;
    background: ${QR_BACKGROUND};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    box-shadow: ${({ theme }) => theme.shadow.default};
  }

  .share-actions {
    display: flex;
    gap: 0.5rem;
  }
`;

export default CardShare;
