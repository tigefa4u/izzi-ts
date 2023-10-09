export type UserQuestProps = {
  id: number;
  user_tag: string;
  username: string;
  quest_id: number;
  reward: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

type CP = Omit<
  UserQuestProps,
  "id" | "is_deleted" | "created_at" | "updated_at"
>;
export type UserQuestCreateProps = CP | CP[];

export type UserQuestUpdateProps = Partial<UserQuestProps>;

export type UserQuestUpdateParams = { user_tag: string };

export type UserQuestParams = {
  user_tag: string;
  quest_id?: number | number[];
  is_daily_quest?: boolean;
  is_weekly_quest?: boolean;
};
