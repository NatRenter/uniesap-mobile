import { useWindowDimensions } from "react-native";

import { Breakpoints } from "@/constants/responsive";

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isPhone = width < Breakpoints.tablet;

  const isTablet = width >= Breakpoints.tablet && width < Breakpoints.desktop;

  const isDesktop = width >= Breakpoints.desktop;

  const orientation = width > height ? "landscape" : "portrait";

  return {
    width,
    height,

    isPhone,
    isTablet,
    isDesktop,

    orientation,

    isLandscape: orientation === "landscape",

    isPortrait: orientation === "portrait",
  };
}
