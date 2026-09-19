import styled from "styled-components";
import Logo from "../../assets/logo.svg?react";
import { ColorKey, HeadingSize } from "../../styles/theme";
import Title from "./Title";
import { Link } from "react-router-dom";

interface Props {
  size: HeadingSize;
  color?: ColorKey;
}

const QRULogo = ({ size, color }: Props) => {
  return (
    <Link to="/">
      <StyledLogo>
        <Icon size={size} fill={color} />
        <Title size={size} color={color}>
          QRU
        </Title>
      </StyledLogo>
    </Link>
  );
};

const StyledLogo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  color: ${({ theme }) => theme.color.text};
  text-shadow: -2px 2px 2px hsla(0, 0%, 0%, 0.2);
  overflow: visible;
  &:hover {
    transform: scale(1.1);
    transition: transform 0.3s ease;
  }
`;

const Icon = styled(Logo)<Props>`
  width: ${({ theme, size }) => theme.heading[size].fontSize};
  aspect-ratio: 1 / 1;
  fill: ${({ theme }) => theme.color.primary};
  transition: transform 0.3s ease, fill 0.3s ease;
  overflow: visible;
`;

export default QRULogo;
