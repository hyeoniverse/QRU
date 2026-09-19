import { useDispatch } from "react-redux";
import { openModal } from "../store/slices/modalSlice";

import styled from "styled-components";
import About from "../components/home/About";
import LogoCard from "../components/home/LogoCard";

import NewCardModal from "../components/home/NewCardModal";

function Home() {
  const dispatch = useDispatch();

  return (
    <HomeStyle>
      <section id="home-card">
        <LogoCard onClick={() => dispatch(openModal())} />
        <NewCardModal />
      </section>
      <section id="home-about">
        <About />
      </section>
    </HomeStyle>
  );
}

const HomeStyle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  section {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
`;

export default Home;
