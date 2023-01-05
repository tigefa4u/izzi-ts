import { CardMetadataAssetProps } from "@customTypes/cards";
import { CharacterStatProps } from "@customTypes/characters";
import { RanksMetaProps } from "helpers/helperTypes";

export type CardProps = {
	stats: Omit<CharacterStatProps, "evasion" | "critical" | "accuracy" | "precision">;
	assets: {
		[key in keyof RanksMetaProps]: CardMetadataAssetProps
	};
	name: string;
	// rank: string;
	type: string;
	series: string;
	selected: boolean;
	id: number;
	abilityname: string;
	abilitydescription: string;
	status?: string;
}
export type CustomCardProps = {
    id: number;
    user_tag: string;
    permissions: number;
	cards?: CardProps[];
	info?: {
		gold: number;
		level: number;
		raid_pass: number;
		izzi_points: number;
		shards: number;
		orbs: number;
		status?: string;
	};
    metadata?: any;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}