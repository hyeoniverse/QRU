import { useEffect, useRef } from "react";
import { styled } from "styled-components";
import { FaSearch } from "react-icons/fa";
import Button from "../common/Button";
import InputText from "../common/InputText";

interface Props {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  placeholder?: string;
  onSearch?: (query: string) => void;
  onNavigationToggle?: (open: boolean) => void;
}

function Search({
  isOpen,
  onToggle,
  placeholder,
  onSearch,
  onNavigationToggle,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 검색창 열리면 input에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onToggle(false); // 검색창 닫기
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  useEffect(() => {
    const handleResize = () => {
      const searchWidth = inputRef.current?.offsetWidth || 0;
      const maxWidth = parseInt(
        getComputedStyle(inputRef.current!).maxWidth || "0",
        10
      );

      // InputText의 너비가 최대값에 도달하면 Navigation 닫기
      if (searchWidth >= maxWidth && onNavigationToggle) {
        onNavigationToggle(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // 초기화 시 체크

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [onNavigationToggle]);

  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    if (isOpen && inputRef.current?.value) {
      // 입력값이 있으면 검색 실행
      onSearch?.(inputRef.current.value);
    } else {
      // 검색창 열기/닫기
      onToggle(!isOpen);
      if (!isOpen && inputRef.current) {
        inputRef.current.value = ""; // 닫힐 때 입력값 초기화
      }
    }
  };

  return (
    <StyledSearch className="search" ref={containerRef} $open={isOpen}>
      <InputText
        className="search-input"
        ref={inputRef}
        type="text"
        placeholder={placeholder}
      />
      <Button onMouseDown={handleToggle}>
        <FaSearch />
      </Button>
    </StyledSearch>
  );
}

interface StyleProps {
  $open: boolean;
}

const StyledSearch = styled.div<StyleProps>`
  display: flex;
  flex: 1;
  width: 100%;
  justify-content: flex-end;
  align-items: center;

  overflow: visible;
  transition: width 1s ease;
  gap: 0.5rem;

  .search-input {
    padding: 0.5rem 1rem;
    width: ${({ $open }) => ($open ? "100%" : "0")};
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    transform-origin: right center;
    transform: ${({ $open }) => ($open ? "scaleX(1)" : "scaleX(0)")};
    transition: transform 0.3s ease, opacity 0.3s ease;
    pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
  }

  @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
    width: ${({ $open }) => ($open ? "100%" : "0")};
    transition: width 0.3s ease;
  }
`;

export default Search;
