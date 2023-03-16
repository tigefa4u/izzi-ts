export type StreakProps = {
    id: number;
    user_tag: string;
    username: string;
    daily_quest_streaks: number;
    daily_quest_updated_at?: Date;
    vote_streak: number;
    vote_streak_updated_at?: Date;
    metadata?: Record<string, unknown>;
}

type CP = Omit<StreakProps, "id"> | Omit<StreakProps, "id">[];
export type StreakCreateProps = CP;

export type StreakUpdateProps = Partial<StreakProps>;
