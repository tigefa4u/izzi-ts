export type MarriageProps = {
  id: number;
  user_tag: string;
  married_to: string;
  married_to_username?: string;
  created_at: Date;
  metadata?: {
    badges?: string[];
  }
};

export type MarriageCreateProps =
  | Omit<MarriageProps, "id" | "created_at">
  | Omit<MarriageProps, "id" | "created_at">[];
