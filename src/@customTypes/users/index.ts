import { IgnoreProps } from "@customTypes";

export type UserProps = {
    id: number;
	username: string;
	user_tag: string;
    gold: number;
	level: number;
	exp: number;
	r_exp: number;
	mana: number;
	max_mana: number;
	floor: number;
	max_floor: number;
	ruin: number;
	max_ruin: number;
	max_ruin_floor: number;
	selected_card_id?: number | null;
	selected_team_id?: number | null;
	raid_pass: number;
	max_raid_pass: number;
	is_married: boolean;
	is_active: boolean;
	is_banned: boolean;
	is_premium: boolean;
	premium_since: string;
	premium_days: number;
	premium_days_left: number;
	izzi_points: number;
	orbs: number;
	shards: number;
	vote_streak: number;
	mana_refilled_at: string;
	raid_permit_refilled_at: string;
	voted_at: Date;
	created_at: string;
	updated_at: string;
	reached_max_ruin_at: Date;
	dungeon_mana: number;
	souls: number;
	metadata: {
		status?: string;
		// This allows the user to spawn a raid from their wishlist
		// based on the tax they have paid.
		raidPityCount?: number;
		raidDropPity?: boolean;
	};
	is_mini_premium?: boolean;
	mini_premium_days_left?: number;
	mini_premium_since?: string;
	mini_premium_days?: number;
	game_points: number;
	vote_count?: number;
	monthly_votes: number;
}

export type UserParams = {
    id?: number;
    user_tag?: string;
    is_deleted?: boolean;
    is_banned?: boolean;
	is_active?: boolean;
}

type IgnoreUserProps = IgnoreProps | "user_tag"

export type UserUpdateProps = Omit<Partial<UserProps>, IgnoreUserProps>

export type UserCreateProps = Pick<UserProps, "username" | "user_tag" | "gold" | "is_active">
