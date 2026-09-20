import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { login, logout } from "../../store/slices/authSlice";
import { addToast } from "../../store/slices/toastSlice";
import { isFirebaseConfigured } from "../../services/firebase";
import { findCardBySerial } from "../../services/card";
import { useResponsive } from "../../hooks/useResponsive";

import styled from "styled-components";
import QRULogo from "../common/Logo";
import Loading from "../common/Loading";
import Button from "../common/Button";
import Dropdown from "../common/Dropdown";
import Navigation from "../header/Navigation";
import ThemeSwitcher from "../header/ThemeSwitcher";
import Drawer from "../header/Drawer";
import Search from "../header/Search";
import UserAvatar from "../header/UserAvatar";
import { FaGoogle } from "react-icons/fa";

function Header() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const isLoggedIn = !!user;
  const { isSearchOpen, isMobileOpen, toggleSearch } = useResponsive();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  /** 일련번호로 명함을 찾아 그 화면으로 보낸다. */
  const handleSearch = async (query: string) => {
    if (!query.trim() || isSearching) return;

    if (!isFirebaseConfigured) {
      dispatch(
        addToast({
          type: "error",
          message: "Firebase 설정이 없어 명함을 찾을 수 없습니다.",
        })
      );
      return;
    }

    setIsSearching(true);

    try {
      const result = await findCardBySerial(query);

      if (result.status === "invalid") {
        dispatch(
          addToast({
            type: "error",
            message: "일련번호는 7K3FM-9P2XR 처럼 열 글자입니다.",
          })
        );
        return;
      }

      if (result.status === "missing") {
        dispatch(
          addToast({
            type: "error",
            message: "그 일련번호의 명함을 찾지 못했습니다.",
          })
        );
        return;
      }

      toggleSearch(false);
      navigate("/cards/" + result.card.id);
    } catch (error) {
      console.error("Error finding card:", error);
      dispatch(
        addToast({ type: "error", message: "명함을 찾는 중 오류가 발생했습니다." })
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAuthClick = () => {
    // 설정이 없으면 로그인 창이 뜨지 않으므로 이유를 알려준다.
    if (!isFirebaseConfigured) {
      dispatch(
        addToast({
          type: "error",
          message: "Firebase 설정이 없어 로그인할 수 없습니다. .env 의 VITE_FIREBASE_* 값을 확인해주세요.",
        })
      );
      return;
    }

    if (isLoggedIn) {
      dispatch(logout());
    } else {
      dispatch(login());
    }
  };

  return (
    <HeaderStyle $isSearchOpen={isSearchOpen}>
      <div className="left-section">
        <Drawer />
        <QRULogo size="large" />
        <Navigation />
      </div>
      <Search
        isOpen={isSearchOpen}
        onToggle={toggleSearch}
        placeholder="찾고싶은 명함의 일련번호를 입력하세요"
        onSearch={(query) => void handleSearch(query)}
      />
      <div className="right-section">
        {isLoading ? (
          <Button isLoading>
            <Loading size="small" />
          </Button>
        ) : (
          <>
            {isLoggedIn ? (
              <Dropdown
                toggleButton={<UserAvatar photoURL={user?.photoURL ?? null} />}
                className="auth"
              >
                <>
                  <ThemeSwitcher />
                  <Link to="/mypage" className="item">
                    마이 페이지
                  </Link>
                  <Button
                    className="item"
                    boxShadow="none"
                    onClick={() => dispatch(logout())}
                  >
                    <FaGoogle />
                    로그아웃
                  </Button>
                </>
              </Dropdown>
            ) : (
              <>
                <Button onClick={handleAuthClick}>
                  <FaGoogle />
                  {!isMobileOpen && "로그인"}
                </Button>
                {!isMobileOpen && <ThemeSwitcher />}
              </>
            )}
          </>
        )}
      </div>
    </HeaderStyle>
  );
}

interface Props {
  $isSearchOpen: boolean;
}

const HeaderStyle = styled.header<Props>`
  position: fixed;
  width: 100%;
  height: ${({ theme }) => theme.layout.headerHeight};
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  color: ${({ theme }) => theme.color.text};
  background: ${({ theme }) => theme.color.blur};
  box-shadow: ${({ theme }) => theme.shadow.light};
  gap: 1rem;
  z-index: 1000;
  overflow: visible;

  .left-section,
  .right-section {
    display: flex;
    align-items: center;
    gap: 1rem;

    @media (max-width: 768px) {
      visibility: ${({ $isSearchOpen }) =>
        $isSearchOpen ? "hidden" : "visible"};
      width: ${({ $isSearchOpen }) => ($isSearchOpen ? "0" : "fit-content")};
      opacity: ${({ $isSearchOpen }) => ($isSearchOpen ? 0 : 1)};
      transform: ${({ $isSearchOpen }) =>
        $isSearchOpen ? "scaleX(0)" : "scaleX(1)"};
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: ${({ $isSearchOpen }) =>
        $isSearchOpen ? "none" : "auto"};
    }
  }

  .left-section {
    justify-content: flex-start;
    transform-origin: left;

    ul {
      visibility: ${({ $isSearchOpen }) =>
        $isSearchOpen ? "hidden" : "visible"};
      width: ${({ $isSearchOpen }) => ($isSearchOpen ? "0" : "auto")};
      transform-origin: left;
      transform: ${({ $isSearchOpen }) =>
        $isSearchOpen ? "scaleX(0)" : "scaleX(1)"};
      opacity: ${({ $isSearchOpen }) => ($isSearchOpen ? 0 : 1)};
      transition: all 0.5s ease;
    }
  }

  .right-section {
    justify-content: flex-end;
    transform-origin: right;

    .userCircle {
      /*
       * inline 이면 사진을 불러오지 못했을 때 크기를 잃는다.
       * 대체 텍스트 크기만큼 납작해져 원이 타원이 된다.
       */
      display: block;
      width: 2.5rem;
      /* em 은 부모 글자 크기를 따라가 원이 깨질 수 있다. rem 으로 맞춘다. */
      height: 2.5rem;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: ${({ theme }) => theme.shadow.default};
    }
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
  }
`;

export default Header;
