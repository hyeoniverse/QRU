import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { login, logout } from "../../store/slices/authSlice";
import { addToast } from "../../store/slices/toastSlice";
import { isFirebaseConfigured } from "../../services/firebase";
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
import { FaGoogle, FaUserCircle } from "react-icons/fa";

function Header() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const isLoggedIn = !!user;
  const { isSearchOpen, isMobileOpen, toggleSearch } = useResponsive();

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
                toggleButton={
                  <>
                    {user?.photoURL ? (
                      <img
                        className="userCircle"
                        src={user.photoURL}
                        alt="user avatar"
                      />
                    ) : (
                      <FaUserCircle className="userCircle" />
                    )}
                  </>
                }
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
  height: 4rem;
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
      width: 2.5rem;
      height: 2.5em;
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
