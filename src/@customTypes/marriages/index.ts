export type MarriageProps = {
  id: number;
  user_tag: string;
  married_to: string;
};

export type MarriageCreateProps =
  | Omit<MarriageProps, "id">
  | Omit<MarriageProps, "id">[];
