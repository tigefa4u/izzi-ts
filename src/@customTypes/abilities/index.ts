export type AbilityProps = {
    id: number;
    name: string;
	description: string;
    is_passive: boolean;
	created_at: string;
	updated_at: string;
}

type IgnoreProps = "created_at" | "updated_at"

export type AbilityParams = Omit<Partial<AbilityProps>, IgnoreProps>

export type StatRelationProps = {
    HP: number;
    ATK: number;
    DEF: number;
    SPD: number;
    ACC: number;
    EVA: number;
    CRIT: number;
    INT: number;
}