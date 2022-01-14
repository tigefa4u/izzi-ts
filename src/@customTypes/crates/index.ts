import { XPGainPerRankProps } from "@customTypes";

export type CrateContentProps = {
  cards: {
    [key in keyof XPGainPerRankProps]: number;
  };
  numberOfCards: number;
  orbs?: number;
};

export type CrateProps = {
  id: number;
  category: CrateCategoryProps;
  user_tag: string;
  price: number;
  contents: CrateContentProps;
};

export type CrateParamProps = Pick<CrateProps, "user_tag"> &
  Partial<Pick<CrateProps, "category">>;

export type CreateCreateProps =
  | Omit<CrateProps, "id">
  | Omit<CrateProps, "id">[];

export type CrateCategoryProps = "silver" | "legendary" | "premium";