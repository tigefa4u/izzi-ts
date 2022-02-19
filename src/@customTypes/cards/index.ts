import { IgnoreProps } from "@customTypes";
import { CharacterDetailsProps } from "@customTypes/characters";

export type CardProps = {
    id: number;
	filepath: string;
	copies: number;
	series: string;
	rank: string;
	character_id: number;
    shard_cost: number;
	is_logo: boolean;
    is_event: boolean;
    has_event_ended: boolean;
    is_random: boolean;
	character_level?: number;
	created_at: string;
	updated_at: string;
}

export type CardParams = Omit<Partial<CardProps>, IgnoreProps | "copies" | "filepath">

export type RandomCardProps = CardProps & CharacterDetailsProps;