import styled, { css } from "styled-components";
import { FaPlus } from "react-icons/fa";
import Button from "../common/Button";

interface Props {
  onClick: () => void;
}

function LogoCard({ onClick }: Props) {
  return (
    <StyledLogoCard>
      <div className="content">
        <QRBox>
          <div></div>
          <div className="filled"></div>
          <div className="filled"></div>
          <div></div>
          <div className="filled"></div>
          <div className="filled"></div>
          <div></div>
          <div></div>
          <div className="filled"></div>
        </QRBox>
        <TextBox>
          <div className="logoText">QRU</div>
          <div className="subText">
            Your Digital Identity
            <br />
            나만의 디지털 명함으로 새로운 만남을 손쉽게!
          </div>
        </TextBox>
      </div>
      <div className="footer">
        <Button
          size="extraLarge"
          scheme="primary"
          icon={<FaPlus />}
          styles={extraButtonStyles}
          onClick={onClick}
        >
          나만의 명함 만들기
        </Button>
      </div>
    </StyledLogoCard>
  );
}

const StyledLogoCard = styled.div`
  width: 70%;
  min-width: 300px;
  max-width: ${({ theme }) => theme.layout.width.large};

  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;

  aspect-ratio: 16 / 9;
  background: ${({ theme }) => theme.color.surface};
  border-radius: clamp(1rem, 2vw, 3rem);
  box-shadow: ${({ theme }) => theme.shadow.strong};

  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(15deg) rotateY(-15deg);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  padding: 2rem;
  margin-top: clamp(2rem, 5vw, 5rem);
  margin-bottom: clamp(2rem, 5vw, 5rem);
  gap: 2rem;
  will-change: transform, transform-style, box-shadow;

  &:hover {
    transform: rotateX(0deg) rotateY(0deg);
    box-shadow: ${({ theme }) => theme.shadow.hover};
  }

  &:hover .logoText {
    text-shadow: ${({ theme }) => theme.shadow.light};
  }

  &:hover .subText {
    text-shadow: ${({ theme }) => theme.shadow.light};
  }

  .content {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-evenly;
    width: 100%;
    gap: 2rem;
  }

  .footer {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
`;

const QRBox = styled.div`
  display: grid;
  width: 30%;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 5%;
  aspect-ratio: 1 / 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform, box-shadow;

  div {
    width: 100%;
    height: 100%;
    background: #e0f7fa;
    border-radius: 30%;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2),
      inset 3px -3px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    will-change: transform, box-shadow;
  }

  div:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3),
      inset 0 -3px 6px rgba(0, 0, 0, 0.5);
  }

  .filled {
    background: ${({ theme }) => theme.color.primary};
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5),
      inset 0.3vw -3px 6px rgba(0, 0, 0, 0.4);
    transform: rotateX(-5deg) rotateY(5deg);
  }

  .filled:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5),
      inset 0 -3px 6px rgba(0, 0, 0, 0.3);
  }
`;

const TextBox = styled.div`
  width: 60%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(0.5rem, 2vw, 2rem);
  line-height: 1;

  .logoText {
    font-size: clamp(1.5rem, 8vw, 8rem);
    font-weight: bolder;
    color: ${({ theme }) => theme.color.primary};
    text-shadow: -4px 2px 2px rgba(0, 0, 0, 0.2);
    transition: text-shadow 0.3s ease;

    &:hover {
      text-shadow: ${({ theme }) => theme.shadow.light};
    }
  }

  .subText {
    width: 100%;
    line-height: 1.2;
    font-size: clamp(0.8rem, 2vw, 2rem);
    color: ${({ theme }) => theme.color.text};
    text-align: left;

    text-shadow: -4px 2px 3px rgba(0, 0, 0, 0.2);
    transition: text-shadow 0.3s ease;
    word-break: keep-all;
  }
`;

const extraButtonStyles = css`
  width: 100%;
  max-height: clamp(3rem, 8vw, 5rem);
  font-size: clamp(1rem, 3vw, 2.5rem);
  padding: clamp(1rem, 2vw, 3rem);
  gap: clamp(0.5rem, 2vw, 2rem);

  .buttonIcon {
    font-size: clamp(1rem, 3vw, 3rem);
  }

  &:hover {
    background: ${({ theme }) => theme.color.primary};
    transform: translateY(-0.2rem) translateX(0.2rem);
    box-shadow: ${({ theme }) => theme.shadow.hover};
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${({ theme }) => theme.shadow.default};
  }

  &:focus {
    outline: none;
  }
`;

export default LogoCard;
