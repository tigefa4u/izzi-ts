import { CardMetadataProps } from "@customTypes/cards";

export type MonthlyCardProps = {
  id: number;
  name: string;
  character_id: number;
  is_active: boolean;
  is_deleted: boolean;
  metadata: any;
  created_at: Date;
  updated_at: Date;
};

export type MonthlyCardWithFilepathProps = Pick<
  MonthlyCardProps,
  "id" | "character_id" | "name" | "is_active"
> & {
  metadata: CardMetadataProps;
  series: string;
};
