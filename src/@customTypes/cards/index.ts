import { AssetImageProps, IgnoreProps } from "@customTypes";
import { CharacterDetailsProps } from "@customTypes/characters";
import { RankProps } from "helpers/helperTypes";

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
export type CardTypeMetadataProps = {
	isEvent?: boolean;
	isWorldBoss?: boolean;
	isDarkZone?: boolean;
	isCustomCard?: boolean;
	isMonthlyCard?: boolean;
	isReferralCard?: boolean;
};
export type CardProps = {
    id: number;
	filepath: string;
	copies: number;
	series: string;
	rank: RankProps;
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
	is_world_boss: boolean;
	is_dark_zone: boolean;
	// this column holds true value of card type
	// added this column because only specific rank is being set as 
	// 'isevent' or 'isworldboss'
	card_type_metadata?: CardTypeMetadataProps;
}

export type CardParams = Omit<Partial<CardProps>, IgnoreProps | "copies" | "filepath" | "rank" | "character_id"> & {
	rank?: string | string[];
	character_id?: number | number[];
}

export type RandomCardProps = CardProps & CharacterDetailsProps;