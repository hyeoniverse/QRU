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

/** 긴 변이 MAX_EDGE 를 넘지 않도록 줄인 크기 */
const fitSize = (width: number, height: number) => {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

/**
 * 이미지 파일을 정사각형 JPEG 데이터 URL 로 바꾼다.
 *
 * 명함에서는 원형으로 보여주므로 가운데를 기준으로 잘라낸다.
 * JPEG 은 투명을 표현하지 못해 배경을 흰색으로 채운다.
 */
export const fileToPhotoDataUrl = async (file: File): Promise<string> => {
  const bitmap = await createImageBitmap(file);

  try {
    const edge = Math.min(bitmap.width, bitmap.height);
    const { width } = fitSize(edge, edge);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = width;

    const context = canvas.getContext("2d");
    if (!context) throw new PhotoTooLargeError();

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, width);
    context.drawImage(
      bitmap,
      (bitmap.width - edge) / 2,
      (bitmap.height - edge) / 2,
      edge,
      edge,
      0,
      0,
      width,
      width
    );

    for (const quality of QUALITY_STEPS) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_PHOTO_LENGTH) return dataUrl;
    }

    throw new PhotoTooLargeError();
  } finally {
    bitmap.close();
  }
};
