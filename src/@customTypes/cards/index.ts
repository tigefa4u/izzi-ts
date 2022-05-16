import { AssetImageProps, IgnoreProps } from "@customTypes";
import { CharacterDetailsProps } from "@customTypes/characters";
import { RanksMetaProps } from "helpers/helperTypes";

type Versions = "default" | "medium" | "small"
export type CardMetadataProps = {
	jpeg: AssetImageProps;
	webp: AssetImageProps;
	assets?: {
		[key in keyof RanksMetaProps]: {
			[key in Versions]: {
				filename: string;
				filepath: string;
				version: string;
				resolution: string;
			}
		};
	}
}
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
	metadata?: CardMetadataProps;
	created_at: string;
	updated_at: string;
}

export type CardParams = Omit<Partial<CardProps>, IgnoreProps | "copies" | "filepath">

export type RandomCardProps = CardProps & CharacterDetailsProps;