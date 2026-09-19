export interface ISubItem {
  title: string;
  link: string;
}

export interface INavigation {
  title: string;
  link: string;
  subItems?: ISubItem[];
}
