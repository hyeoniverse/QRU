import { useContext } from "react";
import { ThemeContext } from "../../context/themeContext";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import Button from "../common/Button";
import React from "react";
import { CSSProp } from "styled-components";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  styles?: CSSProp;
}

function ThemeSwitcher({ styles }: Props) {
  const { themeName, toggleTheme } = useContext(ThemeContext);
  return (
    <Button
      onClick={toggleTheme}
      scheme="secondary"
      boxShadow="none"
      styles={styles}
    >
      {themeName === "light" ? <MdLightMode /> : <MdDarkMode />}
    </Button>
  );
}

export default React.memo(ThemeSwitcher);
