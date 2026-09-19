import React from "react";
import styled from "styled-components";
import { FontSize } from "../../styles/theme";

interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  size?: FontSize;
  label?: string;
}

const InputCheck = React.forwardRef<HTMLInputElement, Props>(
  ({ size, label, ...props }, ref) => (
    <StyledInputCheck $size={size} className="input-check">
      {label && <label htmlFor={props.id}>{label}</label>}
      <input type="checkbox" ref={ref} {...props} />
    </StyledInputCheck>
  )
);

InputCheck.displayName = "InputCheck";

interface StyleProps {
  $size?: FontSize;
}

const StyledInputCheck = styled.div<StyleProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;

  label {
    will-change: transform, opacity;
    visibility: hidden;
    opacity: 0;
    transform: translateY(0.5rem);
    transition: all 0.3s ease;
    text-align: center;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    cursor: pointer;
  }

  &:hover label,
  &:focus-within label {
    visibility: visible;
    height: auto;
    opacity: 1;
    transform: translateY(0);
    transition: all 0.3s ease;
  }

  input {
    display: flex;
    align-items: center;
    justify-content: center;

    height: ${({ $size, theme }) =>
      $size ? theme.fontSize[$size] : theme.fontSize.large};
    width: ${({ $size, theme }) =>
      $size ? theme.fontSize[$size] : theme.fontSize.large};
    aspect-ratio: 1;

    cursor: pointer;
    appearance: none;
    border-radius: 8px;
    background: ${({ theme }) => theme.color.blur};
    box-shadow: ${({ theme }) => theme.shadow.light};

    &:checked {
      background: ${({ theme }) => theme.color.primary};
    }

    &:focus-visible {
      box-shadow: ${({ theme }) => theme.shadow.default};
    }

    &:disabled {
      cursor: default;
      opacity: 0.5;
    }
  }
`;

export default InputCheck;
