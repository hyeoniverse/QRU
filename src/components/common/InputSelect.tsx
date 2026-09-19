import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { IoMdArrowDropdown } from "react-icons/io";
import { IOption } from "../../types/formType";

interface Props {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  options: IOption[];
  onChange: (value: string) => void;
  /** 목록이 닫힐 때(선택 또는 바깥 클릭) 호출된다. */
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const InputSelect = ({
  id,
  name,
  label,
  value,
  options,
  onChange,
  onBlur,
  placeholder = "선택하세요",
  disabled,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 핸들러가 매 렌더마다 다시 등록되지 않도록 최신 콜백만 참조한다.
  const onBlurRef = useRef(onBlur);
  useEffect(() => {
    onBlurRef.current = onBlur;
  });

  useEffect(() => {
    if (!isOpen) return;

    const close = () => {
      setIsOpen(false);
      onBlurRef.current?.();
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (selectRef.current?.contains(event.target as Node)) return;
      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // 목록만 닫고 모달까지 닫히지는 않도록 막는다.
      event.stopPropagation();
      close();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    onBlur?.();
  };

  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <StyledInputSelect ref={selectRef} $open={isOpen}>
      {label && <label htmlFor={id}>{label}</label>}
      <button
        type="button"
        id={id}
        name={name}
        className="select-display"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={selectedLabel ? "select-value" : "select-value placeholder"}>
          {selectedLabel ?? placeholder}
        </span>
        <IoMdArrowDropdown className={`select-arrow ${isOpen ? "open" : ""}`} />
      </button>
      <ul className="options-list" role="listbox" aria-label={label ?? name}>
        {options.map((option) => (
          <li
            key={option.value}
            role="option"
            aria-selected={option.value === value}
            className={`option-item ${option.value === value ? "selected" : ""}`}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </StyledInputSelect>
  );
};

interface StyleProps {
  $open: boolean;
}

const StyledInputSelect = styled.div<StyleProps>`
  position: relative;

  label {
    margin-left: 0.5rem;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.text};
  }

  .select-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.5rem 1rem;
    border: none;
    box-shadow: ${({ theme }) => theme.shadow.light};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    background: ${({ theme }) => theme.color.blur};
    color: ${({ theme }) => theme.color.text};
    font-family: inherit;
    font-size: ${({ theme }) => theme.fontSize.small};
    text-align: left;
    cursor: pointer;
    line-height: 1.8;
    height: 2.5rem;
    z-index: 1000;

    &:disabled {
      cursor: default;
      opacity: 0.5;
    }

    .select-value {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.placeholder {
        color: ${({ theme }) => theme.color.textSecondary};
      }
    }

    .select-arrow {
      flex-shrink: 0;
      margin-left: 0.5rem;
      transition: transform 0.25s ease-in-out;
      font-size: ${({ theme }) => theme.fontSize.large};
      color: ${({ theme }) => theme.color.primary};

      &.open {
        transform: rotate(180deg);
      }
    }
  }

  .options-list {
    width: 100%;
    visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
    opacity: ${({ $open }) => ($open ? "1" : "0")};
    transform-origin: top;
    transform: ${({ $open }) => ($open ? "scaleY(1)" : "scaleY(0)")};
    transition: all 0.3s ease-in-out;

    position: absolute;
    top: 100%;
    max-height: 10rem;
    overflow-y: auto;
    margin: 0;
    padding: 0.5rem;

    list-style: none;
    box-shadow: ${({ theme }) => theme.shadow.default};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    background: ${({ theme }) => theme.color.surface};
    z-index: 2000;

    .option-item {
      padding: 0.5rem 1rem;
      border-radius: ${({ theme }) => theme.borderRadius.default};
      cursor: pointer;
      margin: 0.5rem;
      white-space: nowrap;

      &.selected {
        background: ${({ theme }) => theme.color.blur};
        box-shadow: ${({ theme }) => theme.shadow.light};
      }

      &:hover {
        background: ${({ theme }) => theme.color.secondary};
        box-shadow: ${({ theme }) => theme.shadow.light};
      }
    }
  }
`;

export default InputSelect;
