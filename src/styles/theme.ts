export type ThemeName = "light" | "dark";

export type ColorKey =
  | "primary" // 주 색상
  | "primaryVariant" // 주 색상 변형
  | "secondary" // 보조 색상
  | "secondaryVariant" // 보조 색상 변형
  | "background" // 배경 색상
  | "surface" // 표면 색상 ex) 카드, 버튼
  | "error" // 오류 색상
  | "onPrimary" // 주 색상 위의 텍스트 색상
  | "onSecondary" // 보조 색상 위의 텍스트 색상
  | "onBackground" // 배경 색상 위의 텍스트 색상
  | "onSurface" // 표면 색상 위의 텍스트 색상
  | "onError" // 오류 색상 위의 텍스트 색상
  | "blur" // 흐린 색상
  | "text" // 텍스트 색상
  | "textSecondary" // 보조 텍스트 색상 ex) placeholder, 자동 입력 값
  | "onText"; // 텍스트 위의 색상
export type FontSize =
  | "extraLarge"
  | "large"
  | "medium"
  | "small"
  | "extraSmall";
export type HeadingSize = "extraLarge" | "large" | "medium" | "small";
export type BorderRadius = "default" | "rounded";
export type ButtonSize =
  | "extraLarge"
  | "large"
  | "medium"
  | "small"
  | "extraSmall";
export type ButtonScheme =
  | "primary"
  | "secondary"
  | "blur"
  | "error"
  | "default";
export type Shadow = "default" | "strong" | "light" | "hover" | "none";
export type LayoutWidth = "large" | "medium" | "small";
export type MediaQuery = "mobile" | "tablet" | "desktop";
export interface Theme {
  name: ThemeName;
  color: Record<ColorKey, string>;
  fontSize: Record<FontSize, string>;
  borderRadius: Record<BorderRadius, string>;
  heading: {
    [key in HeadingSize]: {
      fontSize: string;
    };
  };
  button: {
    [key in ButtonSize]: {
      fontSize: string;
      padding: string;
      gap?: string;
    };
  };
  buttonScheme: {
    [key in ButtonScheme]: {
      color: string;
      backgroundColor: string;
      hover?: string;
    };
  };
  shadow: {
    [key in Shadow]: string;
  };
  layout: {
    width: {
      [key in LayoutWidth]: string;
    };
  };
  mediaQuery: {
    [key in MediaQuery]: string;
  };
}

export const lightTheme: Theme = {
  name: "dark",
  color: {
    primary: "#4db6ac",
    primaryVariant: "#00867d",
    secondary: "#e0f7fa",
    secondaryVariant: "#a8edea",
    background: "linear-gradient(135deg, #a8edea, #fed6e3)",
    surface: "#fafafa",
    error: "#FFA0C0",
    onPrimary: "#f4f4f4",
    onSecondary: "#213C48",
    onBackground: "#ffffff",
    onSurface: "#000000",
    onError: "#ffffff",
    blur: "rgba(255, 255, 255, 0.15)",
    text: "#213C48",
    textSecondary: "#5c7a88",
    onText: "#e0f7fa",
  },
  fontSize: {
    extraLarge: "2rem",
    large: "1.5rem",
    medium: "1.2rem",
    small: "1rem",
    extraSmall: "0.8rem",
  },
  heading: {
    extraLarge: {
      fontSize: "2.5rem",
    },
    large: {
      fontSize: "2rem",
    },
    medium: {
      fontSize: "1.5rem",
    },
    small: {
      fontSize: "1rem",
    },
  },
  borderRadius: {
    default: "clamp(1rem, 3.5vw, 1.2rem)",
    rounded: "clamp(1.5rem, 6vw, 4rem)",
  },
  button: {
    extraLarge: {
      fontSize: "1.5rem",
      padding: "1rem 2rem",
      gap: "1.5rem",
    },
    large: {
      fontSize: "1.3rem",
      padding: "1rem 1.5rem",
      gap: "1rem",
    },
    medium: {
      fontSize: "1.2rem",
      padding: "0.8rem 1.2rem",
      gap: "0.5rem",
    },
    small: {
      fontSize: "1rem",
      padding: "0.3rem 0.8rem",
      gap: "0.3rem",
    },
    extraSmall: {
      fontSize: "0.8rem",
      padding: "0 0.5rem",
      gap: "0.2rem",
    },
  },
  buttonScheme: {
    primary: {
      color: "#f4f4f4",
      backgroundColor: "#4db6ac",
    },
    secondary: {
      color: "#213C48",
      backgroundColor: "transparent",
    },
    blur: {
      color: "#213C48",
      backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    error: {
      color: "#ffffff",
      backgroundColor: "#FFA0C0",
    },
    default: {
      color: "#213C48",
      backgroundColor: "#e0f7fa",
    },
  },
  shadow: {
    default:
      "-4px 4px 4px rgba(0, 0, 0, 0.2), inset 2px -4px 4px rgba(0, 0, 0, 0.3)",
    strong:
      "-15px 15px 15px rgba(0, 0, 0, 0.4), inset 4px -4px 8px rgba(0, 0, 0, 0.2)",
    light:
      "-2px 2px 4px rgba(0, 0, 0, 0.2), inset 2px -2px 4px rgba(0, 0, 0, 0.3)",
    hover:
      "-10px 10px 10px rgba(0, 0, 0, 0.3), inset 4px -6px 4px rgba(0, 0, 0, 0.3)",
    none: "none",
  },
  layout: {
    width: {
      large: "1020px",
      medium: "760px",
      small: "320px",
    },
  },
  mediaQuery: {
    mobile: "(max-width: 768px)", // 768px 이하 에서 동작
    tablet: "(max-width: 1024px)", // 1024 px 이하에서 동작
    desktop: "(min-width: 1025px)", // 1025px 이상에서 동작
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  name: "light",
  color: {
    primary: "#00867d",
    primaryVariant: "#4db6ac",
    secondary: "#3a5663",
    secondaryVariant: "#213C48",
    background: "linear-gradient(135deg, #3a5663, #65474c)",
    surface: "#2b2b2b",
    error: "#cf6679",
    onPrimary: "#141414",
    onSecondary: "#ffffff",
    onBackground: "#ffffff",
    onSurface: "#ffffff",
    onError: "#ffffff",
    blur: "rgba(1, 1, 1, 0.1)",
    text: "#e8e8e8",
    textSecondary: "#9aa5aa",
    onText: "#00867d",
  },
  shadow: {
    default:
      "-4px 4px 4px rgba(0, 0, 0, 0.3), inset 2px -4px 4px rgba(0, 0, 0, 0.7)",
    strong:
      "-15px 15px 15px rgba(0, 0, 0, 0.4), inset 4px -4px 8px rgba(0, 0, 0, 0.7)",
    light:
      "-2px 2px 4px rgba(0, 0, 0, 0.3), inset 2px -2px 4px rgba(0, 0, 0, 0.5)",
    hover:
      "-10px 10px 10px rgba(0, 0, 0, 0.5), inset 4px -6px 4px rgba(0, 0, 0, 0.7)",
    none: "none",
  },
  buttonScheme: {
    primary: {
      color: "#ffffff",
      backgroundColor: "#00867d",
    },
    secondary: {
      color: "#e8e8e8",
      backgroundColor: "transparent",
    },
    blur: {
      color: "#e8e8e8",
      backgroundColor: "rgba(1, 1, 1, 0.15)",
    },
    error: {
      color: "#ffffff",
      backgroundColor: "#cf6679",
    },
    default: {
      color: "#ffffff",
      backgroundColor: "#3a5663",
    },
  },
};

export const getTheme = (themeName: ThemeName): Theme => {
  return themeName === "dark" ? darkTheme : lightTheme;
};
