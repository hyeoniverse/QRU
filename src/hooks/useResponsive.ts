import { useEffect, useState } from "react";

export const useResponsive = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  /** 값을 주면 그대로 맞추고, 없으면 뒤집는다. */
  const toggleSearch = (open?: boolean) => {
    setIsSearchOpen((prev) => open ?? !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOpen(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isSearchOpen, isMobileOpen, toggleSearch };
};
