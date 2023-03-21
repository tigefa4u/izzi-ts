export type WorldBossBattleProps = {
    id: number;
    user_tag: string;
    character_id: number;
    damage_dealt: number;
    boss_stats: Record<string, unknown>;
    loot: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export type CreateWorldBossBattleProps = Omit<WorldBossBattleProps, "id"> | Omit<WorldBossBattleProps, "id">[];
