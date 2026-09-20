import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { FaCheck, FaImage, FaMagnifyingGlassMinus, FaMagnifyingGlassPlus, FaX } from "react-icons/fa6";

import { CropRect, cropToDataUrl } from "../../utils/imageUtil";
import Button from "../common/Button";
import Loading from "../common/Loading";

/** 확대 범위. 1 이면 사진이 원형에 꽉 차는 상태다. */
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.2;

/** 화살표 키로 한 번에 움직이는 거리 */
const NUDGE = 8;

interface Props {
  /** 편집할 사진. 데이터 URL */
  source: string;
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
  /** 다른 사진을 고르러 갈 때 */
  onPickAnother: () => void;
  onError: (message: string) => void;
}

interface Size {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * 명함 사진을 원형에 맞춰 다듬는다.
 *
 * 끌어서 위치를 잡고, 밀거나 슬라이더로 확대한다. 보이는 원이 그대로
 * 잘려나갈 영역이라 결과를 따로 상상할 필요가 없다.
 */
function PhotoEditor({ source, onApply, onCancel, onPickAnother, onError }: Props) {
  const viewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  const [viewSize, setViewSize] = useState(0);
  const [natural, setNatural] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isApplying, setIsApplying] = useState(false);

  // 원의 지름은 화면 폭에 따라 달라진다. 계산이 어긋나지 않도록 실제 값을 쓴다.
  useEffect(() => {
    const element = viewRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setViewSize(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /** 사진이 원을 항상 덮는 최소 배율 */
  const baseScale =
    natural && viewSize
      ? viewSize / Math.min(natural.width, natural.height)
      : 0;
  const scale = baseScale * zoom;

  /**
   * 크기를 계산할 수 있게 되었는지.
   *
   * 그 전까지 사진을 그리면 원본 크기 그대로 한 프레임 비친다.
   */
  const isReady = Boolean(natural) && viewSize > 0;

  /** 빈 곳이 드러나지 않도록 움직일 수 있는 범위로 가둔다. */
  const clampOffset = useCallback(
    (next: { x: number; y: number }, atScale: number) => {
      if (!natural) return next;

      const width = natural.width * atScale;
      const height = natural.height * atScale;

      return {
        x: clamp(next.x, viewSize - width, 0),
        y: clamp(next.y, viewSize - height, 0),
      };
    },
    [natural, viewSize]
  );

  const center = useCallback(
    (atScale: number) => {
      if (!natural) return { x: 0, y: 0 };

      return {
        x: (viewSize - natural.width * atScale) / 2,
        y: (viewSize - natural.height * atScale) / 2,
      };
    },
    [natural, viewSize]
  );

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    setNatural({ width: naturalWidth, height: naturalHeight });
    setZoom(MIN_ZOOM);
  };

  // 사진이나 원 크기가 바뀌면 가운데에서 다시 시작한다.
  useEffect(() => {
    if (!natural || !viewSize) return;
    setOffset(center(baseScale * MIN_ZOOM));
    setZoom(MIN_ZOOM);
  }, [natural, viewSize, baseScale, center]);

  /** 원의 한가운데를 붙잡은 채 배율만 바꾼다. */
  const changeZoom = useCallback(
    (next: number) => {
      const target = clamp(next, MIN_ZOOM, MAX_ZOOM);
      if (!natural || !viewSize) return;

      const from = baseScale * zoom;
      const to = baseScale * target;
      const middle = viewSize / 2;

      setOffset((current) =>
        clampOffset(
          {
            x: middle - ((middle - current.x) / from) * to,
            y: middle - ((middle - current.y) / from) * to,
          },
          to
        )
      );
      setZoom(target);
    },
    [baseScale, clampOffset, natural, viewSize, zoom]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY };

    setOffset((current) => clampOffset({ x: current.x + dx, y: current.y + dy }, scale));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
    };

    const move = moves[event.key];
    if (!move) return;

    event.preventDefault();
    setOffset((current) =>
      clampOffset({ x: current.x + move[0], y: current.y + move[1] }, scale)
    );
  };

  const handleApply = async () => {
    if (!natural || !scale) return;

    setIsApplying(true);

    try {
      const rect: CropRect = {
        x: -offset.x / scale,
        y: -offset.y / scale,
        size: viewSize / scale,
      };
      onApply(await cropToDataUrl(source, rect));
    } catch (error) {
      console.error("Error cropping photo:", error);
      onError(
        error instanceof Error && error.name === "PhotoTooLargeError"
          ? error.message
          : "사진을 처리하지 못했습니다. 다른 이미지를 사용해주세요."
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <StyledPhotoEditor role="dialog" aria-modal="true" aria-label="사진 편집">
      <div className="editor-panel">
        <p className="editor-title">사진 맞추기</p>
        <p className="editor-hint">
          끌어서 위치를 잡고, 아래 막대로 크기를 맞춰주세요. 원 안이 그대로 명함에 들어갑니다.
        </p>

        <div
          ref={viewRef}
          className="editor-view"
          role="application"
          aria-label="사진 위치 조절. 화살표 키로도 움직일 수 있습니다."
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={handleKeyDown}
        >
          <img
            className="editor-image"
            src={source}
            alt=""
            draggable={false}
            onLoad={handleLoad}
            style={
              isReady && natural
                ? {
                    width: natural.width * scale,
                    height: natural.height * scale,
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                  }
                : { visibility: "hidden" }
            }
          />
          {!isReady && <Loading size="medium" />}
          <div className="editor-mask" aria-hidden />
        </div>

        <div className="editor-zoom">
          <button
            type="button"
            className="zoom-step"
            aria-label="축소"
            onClick={() => changeZoom(zoom - ZOOM_STEP)}
          >
            <FaMagnifyingGlassMinus />
          </button>
          <input
            type="range"
            aria-label="사진 크기"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
          />
          <button
            type="button"
            className="zoom-step"
            aria-label="확대"
            onClick={() => changeZoom(zoom + ZOOM_STEP)}
          >
            <FaMagnifyingGlassPlus />
          </button>
        </div>

        <div className="editor-buttons">
          <Button type="button" size="small" scheme="primary" disabled={isApplying} onClick={() => void handleApply()}>
            {isApplying ? <Loading size="small" /> : <FaCheck />} 적용
          </Button>
          <Button type="button" size="small" onClick={onPickAnother}>
            <FaImage /> 다른 사진
          </Button>
          <Button type="button" size="small" onClick={onCancel}>
            <FaX /> 취소
          </Button>
        </div>
      </div>
    </StyledPhotoEditor>
  );
}

const StyledPhotoEditor = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);

  .editor-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: min(22rem, 100%);
    padding: 1.5rem;

    background: ${({ theme }) => theme.color.surface};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    box-shadow: ${({ theme }) => theme.shadow.default};
  }

  .editor-title {
    margin: 0;
    font-weight: bold;
  }

  .editor-hint {
    margin: -0.5rem 0 0;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.textSecondary};
    text-align: center;
    word-break: keep-all;
    line-height: 1.5;
  }

  .editor-view {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(16rem, 70vw);
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 50%;

    background: ${({ theme }) => theme.color.blur};
    box-shadow: ${({ theme }) => theme.shadow.light};
    cursor: grab;
    touch-action: none;

    &:active {
      cursor: grabbing;
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.color.primary};
      outline-offset: 2px;
    }
  }

  .editor-image {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    /* 끌 때 브라우저의 기본 이미지 끌기가 끼어들지 않게 한다. */
    user-select: none;
    pointer-events: none;
    max-width: none;
  }

  /* 원 밖이 잘려나간다는 것을 테두리로 알려준다. */
  .editor-mask {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.color.primary};
    pointer-events: none;
  }

  .editor-zoom {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;

    input[type="range"] {
      flex: 1;
      accent-color: ${({ theme }) => theme.color.primary};
      cursor: pointer;
    }
  }

  .zoom-step {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;

    border: none;
    border-radius: 50%;
    background: ${({ theme }) => theme.color.blur};
    color: ${({ theme }) => theme.color.text};
    cursor: pointer;
  }

  .editor-buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
  }
`;

export default PhotoEditor;
