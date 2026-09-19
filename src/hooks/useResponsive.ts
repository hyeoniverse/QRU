import { useEffect, useState } from "react";

export const useResponsive = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
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
