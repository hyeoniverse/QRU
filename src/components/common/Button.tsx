import styled, { CSSProp } from "styled-components";
import { ButtonScheme, ButtonSize, Shadow } from "../../styles/theme";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
  icon?: React.ReactNode;
  size?: ButtonSize;
  scheme?: ButtonScheme;
  boxShadow?: Shadow;
  disabled?: boolean;
  isLoading?: boolean;
  styles?: string | CSSProp;
  tooltip?: string;
}

function Button({
  children,
  ref,
  icon,
  size,
  scheme,
  boxShadow,
  disabled,
  isLoading,
  tooltip,
  ...props
}: Props) {
  return (
    <StyledButton
      ref={ref}
      size={size}
      scheme={scheme}
      boxShadow={boxShadow}
      disabled={disabled}
      isLoading={isLoading}
      data-tooltip={tooltip}
      {...props}
    >
      {icon && <div className="icon">{icon}</div>}
      {children}
    </StyledButton>
  );
}

export const StyledButton = styled.button.withConfig({
  shouldForwardProp: (prop) =>
    !["isLoading", "styles", "boxShadow"].includes(prop),
})<Omit<Props, "children" | "icon">>`
  position: relative;
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;

  font-size: ${({ theme, size }) =>
    size ? theme.button[size].fontSize : theme.button.medium.fontSize};
  padding: ${({ theme, size }) =>
    size ? theme.button[size].padding : theme.button.medium.padding};
  gap: ${({ theme, size }) =>
    size ? theme.button[size].gap : theme.button.medium.gap};

  color: ${({ theme, scheme }) =>
    scheme
      ? theme.buttonScheme[scheme].color
      : theme.buttonScheme.default.color};
  background: ${({ theme, scheme }) =>
    scheme
      ? theme.buttonScheme[scheme].backgroundColor
      : theme.buttonScheme.default.backgroundColor};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  box-shadow: ${({ theme, boxShadow }) =>
    boxShadow ? theme.shadow[boxShadow] : theme.shadow.default};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  cursor: ${({ disabled }) => (disabled ? "none" : "pointer")};

  white-space: nowrap;
  text-overflow: ellipsis;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  svg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(
      ${({ theme, size }) =>
          size ? theme.button[size].fontSize : theme.button.medium.fontSize} *
        1.8
    );
    aspect-ratio: 1/1;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${({ theme, size }) =>
      size ? theme.button[size].fontSize : theme.button.small.fontSize};
  }

  &:hover {
    color: ${({ theme }) => theme.color.text};
    background: ${({ theme }) => theme.color.blur};
    box-shadow: ${({ theme }) => theme.shadow.default};
  }

  &[data-tooltip]:hover::after,
  &[data-tooltip]:focus::after {
    width: max-content;
    max-width: calc(60vw - 2rem);
    content: attr(data-tooltip);
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.5rem;
    padding: 1rem 1.5rem;

    line-height: 1.8;
    white-space: break-spaces;
    text-align: left;

    background: ${({ theme }) => theme.color.error};
    color: ${({ theme }) => theme.color.onError};
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    box-shadow: ${({ theme }) => theme.shadow.default};

    opacity: 1;
    transform: scaleY(1);
    transition: all 0.3s ease;
  }

  &[data-tooltip]::after {
    pointer-events: none;
    opacity: 0;
    transform-origin: top;
    transform: scaleY(0);
  }

  ${({ styles }) => styles || ""}
`;

export default Button;
