import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";

interface Props {
  /** Google 계정의 프로필 사진 주소. 없으면 기본 아이콘을 쓴다. */
  photoURL: string | null;
}

/**
 * 헤더의 프로필 사진.
 *
 * 사진을 불러오지 못하면 기본 아이콘으로 바꾼다. 깨진 <img> 는 브라우저가
 * 대체 텍스트를 담은 inline 비대체 요소로 그리는데, 그 상태에서는 CSS 의
 * width/height 가 적용되지 않는다. 지정한 크기를 잃고 글자 크기만큼
 * 납작해진 채 border-radius 만 남아 타원으로 보인다.
 */
function UserAvatar({ photoURL }: Props) {
  // 주소째로 기억해둔다. 다른 계정으로 바꿔 로그인하면 다시 시도한다.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!photoURL || failedUrl === photoURL) {
    return <FaUserCircle className="userCircle" />;
  }

  return (
    <img
      className="userCircle"
      src={photoURL}
      alt="프로필 사진"
      onError={() => setFailedUrl(photoURL)}
    />
  );
}

export default UserAvatar;
