import { AssetImageProps, IgnoreProps } from "@customTypes";
import { CharacterDetailsProps } from "@customTypes/characters";

type Versions = "default" | "medium" | "small"
export type CardMetadataAssetProps = {
	[key in Versions]: {
		filename: string;
		filepath: string;
		version: string;
		resolution: string;
	}
}
export type CardMetadataProps = {
	jpeg: AssetImageProps;
	webp: AssetImageProps;
	assets?: CardMetadataAssetProps;
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
	is_referral_card: boolean;
}

export type CardParams = Omit<Partial<CardProps>, IgnoreProps | "copies" | "filepath">

export type RandomCardProps = CardProps & CharacterDetailsProps;