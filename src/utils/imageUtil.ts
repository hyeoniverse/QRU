/**
 * 명함 사진을 문서에 담을 수 있는 크기로 줄인다.
 *
 * Firebase Storage 를 쓰지 않고 Firestore 에 데이터 URL 로 넣기 때문에
 * 크기를 확실히 눌러야 한다. 원본을 그대로 두면 휴대폰 사진 한 장이
 * 문서 한도(1MB)를 넘긴다.
 */

/** 긴 변 기준 최대 픽셀. 화면에서 가장 크게 쓰는 곳이 180px 이라 넉넉하다. */
const MAX_EDGE = 512;

/** 데이터 URL 기준 상한. 보안 규칙도 같은 값으로 막는다. */
export const MAX_PHOTO_LENGTH = 150_000;

/** 용량이 넘치면 화질을 한 단계씩 낮춰 다시 시도한다. */
const QUALITY_STEPS = [0.75, 0.6, 0.45, 0.3];

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp";

export class PhotoTooLargeError extends Error {
  constructor() {
    super("사진 용량을 줄이지 못했습니다. 더 작은 이미지를 사용해주세요.");
    this.name = "PhotoTooLargeError";
  }
}

/** 편집기에서 잘라낼 영역. 원본 이미지의 픽셀 좌표 기준인 정사각형이다. */
export interface CropRect {
  x: number;
  y: number;
  size: number;
}

/** 파일을 화면에 띄울 수 있는 데이터 URL 로 읽는다. */
export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("읽기 실패"));
    reader.readAsDataURL(file);
  });

/** 데이터 URL 을 그릴 수 있는 이미지로 만든다. */
export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    image.src = src;
  });

/** 한 픽셀이라도 비쳐 보이면 투명을 살려야 한다. */
const hasTransparency = (
  context: CanvasRenderingContext2D,
  edge: number
): boolean => {
  const { data } = context.getImageData(0, 0, edge, edge);

  for (let at = 3; at < data.length; at += 4) {
    if (data[at] < 255) return true;
  }

  return false;
};

/** 브라우저가 WebP 로 내보낼 수 있는지. 투명을 살리려면 이것이 필요하다. */
const canEncodeWebp = (canvas: HTMLCanvasElement): boolean =>
  canvas.toDataURL("image/webp").startsWith("data:image/webp");

/** 이미 그려진 그림 뒤에 흰 종이를 깐다. */
const fillBehind = (context: CanvasRenderingContext2D, edge: number) => {
  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, edge, edge);
  context.globalCompositeOperation = "source-over";
};

/** 용량 안에 들어오는 첫 번째 결과를 돌려준다. 없으면 null */
const encode = (canvas: HTMLCanvasElement, type: string): string | null => {
  for (const quality of QUALITY_STEPS) {
    const dataUrl = canvas.toDataURL(type, quality);
    if (dataUrl.length <= MAX_PHOTO_LENGTH) return dataUrl;
  }

  return null;
};

/**
 * 고른 영역을 정사각형 데이터 URL 로 만든다.
 *
 * 투명한 부분이 있으면 WebP 로 내보내 그대로 살린다. JPEG 은 투명을
 * 표현하지 못해 흰색으로 메워지는데, 배경이 없는 그림을 올렸을 때
 * 올리지 않은 흰 네모가 생긴다.
 *
 * 투명한 곳이 없으면 사진일 가능성이 높아 JPEG 을 쓴다. 같은 용량에서
 * 사진은 JPEG 이 대체로 더 낫다.
 */
export const cropToDataUrl = async (
  src: string,
  rect: CropRect
): Promise<string> => {
  const image = await loadImage(src);

  // 잘라낸 영역이 작으면 그만큼만 쓴다. 없는 화소를 늘려봐야 용량만 는다.
  const edge = Math.max(1, Math.round(Math.min(MAX_EDGE, rect.size)));

  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;

  const context = canvas.getContext("2d");
  if (!context) throw new PhotoTooLargeError();

  context.drawImage(image, rect.x, rect.y, rect.size, rect.size, 0, 0, edge, edge);

  if (hasTransparency(context, edge) && canEncodeWebp(canvas)) {
    const transparent = encode(canvas, "image/webp");
    if (transparent) return transparent;
    // 투명을 살리면 용량을 못 맞출 때가 있다. 그때는 흰 배경을 깐다.
  }

  fillBehind(context, edge);

  const opaque = encode(canvas, "image/jpeg");
  if (opaque) return opaque;

  throw new PhotoTooLargeError();
};
