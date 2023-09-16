import { Client, CommandInteraction, Message, MessageButtonStyleResolvable } from "discord.js";
import { RankProps } from "helpers/helperTypes";
import { CharacterStatProps } from "./characters";
import { PagingMetadata } from "./pagination";

export type IgnoreProps = "id" | "created_at" | "updated_at"

export type FilterProps = {
    name?: string | string[];
    rank?: RankProps | RankProps[];
    type?: string | string[];
    abilityname?: string | string[];
    series?: string;
    ids?: number[];
    category?: string;
    rank_ids?: number | number[];
    is_favorite?: boolean;
    is_on_market?: boolean;
    is_on_cooldown?: boolean;
    difficulty?: string[];
    isEvent?: boolean;
    limit?: number | number[];
    page?: string[];
    isExactMatch?: boolean;
    exclude?: string[];
    year?: number;
    collection_ids?: number[];
}

export type AuthorProps = Message["author"] | CommandInteraction["user"]

export type ResponseWithPagination<T> = {
    data: T,
    metadata: PagingMetadata
}

export type ChannelProp = Message["channel"] | CommandInteraction["channel"]

export type ReactionsProps = {
    [key: string]: {
        label: string;
        emoji: string;
        style?: MessageButtonStyleResolvable
    }
}

export type ParamsFromArgsRT<T> = {
    [key in keyof T]: T[key];
}

export type XPGainPerRankProps = {
    [rank in RankProps]: number;
}

export type AssetImageProps = {
    filepath: string;
    fullpath: string;
    mimetype: string;
    originalname: string;
    bucket: string;
    path: string;
    resolution: string;
    absolutepath: string;
    dimensions: string;
    ext: string;
}

export type ConfirmationInteractionParams<T = void> = {
    author: AuthorProps;
    channel: ChannelProp;
    client: Client;
    extras?: T
}

export type ConfirmationInteractionOptions = {
    isConfirm: boolean;
}

export type EmbedEditOptions = {
    reattachOnEdit?: boolean;
    appendConsoleButton?: boolean;
}

export type OverallStatsProps = CharacterStatProps & {
    vitalityBonus?: number;
    defenseBonus?: number;
    dexterityBonus?: number;
    strengthBonus?: number;
    intelligenceBonus?: number;
    effective?: number;
    originalHp?: number;
}

export type MapProps = {
	[key: string]: string;
}

export type SafeParseQueryProps<Q, A> = {
    query: {
        [key in keyof Q]: Q[key];
    };
    attributes: {
        [key in keyof A]: {
            columnName?: string;
            type: string;
            default?: string | boolean | number;
            ref?: string;
            required?: boolean;
            autoIncrement?: boolean;
        };
    };
}