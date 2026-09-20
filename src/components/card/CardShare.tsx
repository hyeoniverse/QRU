import { ReactNode, useRef } from "react";
import styled from "styled-components";
import { QRCodeCanvas } from "qrcode.react";
import { FaCheck, FaDownload, FaLink } from "react-icons/fa";
import { useCopy } from "../../hooks/useCopy";
import Button from "../common/Button";
import CopyText from "../common/CopyText";

interface Props {
  url: string;
  serialNumber: string;
  /** 소유자에게만 보여줄 버튼 등, 공유 묶음에 덧붙일 것 */
  actions?: ReactNode;
}

const QR_SIZE = 150;

/** QR 코드를 스캔 가능한 대비로 유지하기 위해 테마와 무관하게 고정한다. */
const QR_BACKGROUND = "#ffffff";
const QR_FOREGROUND = "#213c48";

/**
 * 명함을 건네는 데 필요한 것을 한 묶음으로 모은다.
 *
 * QR, 링크, 일련번호는 모두 "이 명함을 남에게 전한다" 는 같은 일이다.
 * 흩어놓으면 그때마다 어디를 봐야 하는지 다시 찾게 된다.
 */
function CardShare({ url, serialNumber, actions }: Props) {
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

      <div className="share-side">
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

        {serialNumber && (
          <div className="share-serial">
            <span>일련번호</span>
            <CopyText value={serialNumber} label="일련번호" />
          </div>
        )}

        {actions}
      </div>
    </StyledCardShare>
  );
}

const StyledCardShare = styled.aside`
  /*
   * QR 과 버튼을 나란히 눕힌다. 세로로 쌓으면 이 묶음이 길어지고,
   * 그만큼 옆자리(이름 쪽)가 비어 보인다.
   */
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.25rem;

  .share-side {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .qr-box {
    display: flex;
    padding: 0.75rem;
    background: ${QR_BACKGROUND};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    box-shadow: ${({ theme }) => theme.shadow.light};
  }

  .share-actions {
    display: flex;
    gap: 0.5rem;
  }

  .share-serial {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.textSecondary};
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    flex-direction: column;
    width: 100%;

    .share-side {
      align-items: center;
    }
  }
`;

export default CardShare;
