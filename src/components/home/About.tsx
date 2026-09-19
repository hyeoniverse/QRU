import React from "react";
import styled from "styled-components";
import Title from "../common/Title";
import Button from "../common/Button";
import { FaGithub, FaReact } from "react-icons/fa";
import { SiStyledcomponents } from "react-icons/si";
import { TbBrandFirebase } from "react-icons/tb";
import { BiQrScan } from "react-icons/bi";

const About: React.FC = () => {
  return (
    <StyledAbout id="home-about">
      <section id="home-about-intro">
        <Title size="extraLarge">
          🧩 큐알유(QRU): QR코드로 만드는 디지털 명함
        </Title>
        <p>
          <strong>QRU</strong>는 <strong>"QR"</strong> 과{" "}
          <strong>"Who Are You"</strong>를 결합한 이름으로, 사용자가 자신의
          정보를 입력하여 QR 코드를 생성하고 이를 통해 디지털 명함을 공유할 수
          있는 웹 애플리케이션입니다. QR 코드를 통해 손쉽게 자신을 소개하거나
          랜덤 셔플 기능으로 새로운 친구를 만날 수 있습니다.
        </p>
      </section>

      <section id="home-about-feature">
        <Title size="large">✨ 주요 기능</Title>

        <ul>
          <li>
            <strong>디지털 명함 생성 🖋️</strong>: 이름, 전화번호, 성별, MBTI,
            취미, SNS 아이디 등을 입력해 QR 코드를 자동 생성.
          </li>
          <li>
            <strong>디지털 명함 관리 🛠️</strong>: 회원가입 없이 비회원도 랜덤
            발급된 일련번호로 명함 관리 가능.
          </li>
          <li>
            <strong>랜덤 셔플로 친구 만들기 🔄</strong>: 랜덤 셔플 기능을 통해
            새로운 친구 만나기, 필터링 옵션 제공.
          </li>
          <li>
            <strong>정보 공개 설정 🔒</strong>: 특정 정보의 공개 여부를 사용자가
            선택.
          </li>
          <li>
            <strong>커스터마이징 🎨</strong>: QR 코드 및 명함 디자인 선택 가능.
          </li>
        </ul>

        <Title size="large">📐 반응형 웹 디자인</Title>

        <p>
          QRU는 모든 디바이스에서 원활히 동작하도록 설계되었습니다. 간결한 UI와
          터치 친화적인 디자인으로 누구나 쉽게 명함을 생성하고 관리할 수
          있습니다.
        </p>
      </section>

      <section id="home-about-usage">
        <Title size="large">💡 사용 방법</Title>

        <ol>
          <li>사이트에서 정보를 입력하고 "QR 코드 생성" 버튼을 클릭합니다.</li>
          <li>생성된 QR 코드를 다운로드하거나 URL로 공유합니다.</li>
          <li>
            랜덤 셔플 버튼을 눌러 새로운 친구를 만나고, 필터링 옵션으로 원하는
            조건을 설정할 수 있습니다.
          </li>
          <li>
            휴대폰 카메라 등을 이용하여 QR 코드를 스캔하여 명함 정보를 빠르게
            확인할 수 있습니다.
          </li>
        </ol>
      </section>

      <section id="home-about-tech">
        <Title size="large">🔧 기술 스택</Title>
        <ul>
          <li>
            <FaReact />
            React (TypeScript)
          </li>
          <li>
            <SiStyledcomponents />
            Styled-components
          </li>
          <li>
            <TbBrandFirebase />
            Firebase Firestore 및 Authentication
          </li>
          <li>
            <BiQrScan />
            QR 코드 생성 라이브러리
          </li>
        </ul>
      </section>

      <section id="home-about-footer">
        <p>프로젝트에 대한 자세한 정보는 GitHub 레포지토리를 확인해주세요.</p>
        <p>👇👇👇</p>

        <a
          href="https://github.com/CodingKirby/QRU"
          target="_blank"
          rel="noreferrer"
        >
          <Button size="large" scheme="primary">
            <FaGithub />
            GitHub
          </Button>
        </a>
      </section>
    </StyledAbout>
  );
};

const StyledAbout = styled.section`
  display: grid;
  width: 100%;
  word-break: break-all;

  margin: 4rem auto;
  font-size: ${({ theme }) => theme.fontSize.medium};
  font-size: ${({ theme }) => theme.fontSize.medium};
  line-height: 1.8;

  background: ${({ theme }) => theme.color.blur};
  padding: 3rem;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme }) => theme.shadow.default};

  p {
    margin: 0.5rem 0;
    text-align: left;
  }

  ul {
    list-style-type: disc;
    text-align: left;
  }

  ol {
    list-style-type: decimal;
    text-align: left;
  }

  li {
    text-align: left;
    margin-left: -1rem;

    svg {
      margin-right: 1rem;
      width: 2rem;
      height: 2rem;
      color: ${({ theme }) => theme.color.primary};
    }
  }

  strong {
    color: ${({ theme }) => theme.color.primary};
  }

  button {
    &:hover {
      transform: translateY(-0.2rem);
      box-shadow: ${({ theme }) => theme.shadow.hover};
      transition: all 0.3s ease;
    }
  }
`;

export default About;
