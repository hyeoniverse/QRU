import { INavigation } from "../types/navigationType";

export const NAVIGATION: INavigation[] = [
  {
    title: "서비스 소개",
    link: "/#home-about",
    subItems: [
      {
        title: "어떤 서비스인가요?",
        link: "/#home-about-intro",
      },
      {
        title: "어떻게 사용하나요?",
        link: "/#home-about-usage",
      },
    ],
  },
  { title: "명함 찾기", link: "/cards/shuffle" },
];
