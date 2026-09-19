import styled from "styled-components";
import { FaSpinner } from "react-icons/fa";
import { FontSize } from "../../styles/theme";

interface Props {
  size?: FontSize;
}

function Loading({ size }: Props) {
  return (
    <StyledLoading $size={size}>
      <FaSpinner />
    </StyledLoading>
  );
}

const StyledLoading = styled.div<{ $size?: FontSize }>`
  padding: ${({ $size }) => ($size ? "0" : "2rem")} 0;
  text-align: center;

  svg {
    width: ${({ theme, $size }) => ($size ? theme.fontSize[$size] : "4rem")};
    height: ${({ theme, $size }) => ($size ? theme.fontSize[$size] : "4rem")};
    fill: ${({ theme }) => theme.color.primary};
    animation: rotate 1s linear infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
`;

export default Loading;
