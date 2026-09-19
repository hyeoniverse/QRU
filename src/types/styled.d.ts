import "styled-components";
import { Theme } from "../styles/theme";

// styled-components 의 theme 에 프로젝트 테마 타입을 연결한다.
// 존재하지 않는 토큰(theme.color.border 등)을 쓰면 컴파일 단계에서 걸러진다.
declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}
