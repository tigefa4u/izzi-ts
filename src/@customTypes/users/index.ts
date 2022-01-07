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
	selected_card_id: number
	selected_team_id: number;
	raid_pass: number;
	max_raid_pass: number;
	is_married: boolean;
	is_active: boolean;
	is_banned: boolean;
	orbs: number;
	vote_streak: number;
	mana_refilled_at: string;
	raid_permit_refilled_at: string;
	voted_at: string;
	created_at: string;
	updated_at: string;
}

export type UserParams = {
    id?: string;
    user_tag?: string;
    is_deleted?: boolean;
    is_banned?: boolean;
}

type IgnoreUserProps = IgnoreProps | "user_tag"

export type UserUpdateProps = Omit<Partial<UserProps>, IgnoreUserProps>

export type UserCreateProps = Pick<UserProps, "username" | "user_tag" | "gold">
