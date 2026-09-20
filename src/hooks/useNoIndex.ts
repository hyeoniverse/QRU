import { useEffect } from "react";

/**
 * 이 화면을 검색에 걸리지 않게 한다.
 *
 * 한 장짜리 앱이라 모든 주소가 같은 index.html 을 받는다. 파일에
 * 박아두면 홈까지 함께 빠지므로, 화면이 떠 있는 동안만 표시를 단다.
 *
 * 실제로 막는 것은 호스팅이 내려주는 X-Robots-Tag 헤더다. 이것은
 * 그 설정이 빠졌을 때를 대비한 두 번째 그물이다.
 */
export const useNoIndex = () => {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);

    return () => meta.remove();
  }, []);
};

export default useNoIndex;
