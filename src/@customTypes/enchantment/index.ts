import { ChannelProp, FilterProps, XPGainPerRankProps } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { RankProps } from "helpers/helperTypes";

export type ProcessEnchantmentProps = {
    reqExp: number;
    card: CollectionCardInfoProps;
    user_id: number;
    row_number?: number | number[];
    exclude_ids?: number[];
    exclude_character_ids?: number[];
    character_ids?: number[];
    channel?: ChannelProp;
} & Pick<FilterProps, "rank" | "limit" | "name">

export type PrepareRankAndFetchCardsProps<T> = ProcessEnchantmentProps & {
    withDifferentName: XPGainPerRankProps;
    accumulator: T[];
    totalXpGain: number;
    initialRequestPayload: EnchantmentBucketPayload;
    stashRequestPaload?: EnchantmentBucketPayload | null;
    forceExit?: boolean;
    isIterateOver?: boolean;
    isCustomRanks?: boolean;
    isCustomName?: boolean;
    isCustomLimit?: boolean;
}

export type EnchantmentBucketPayload = {
    bucket: XPGainPerRankProps;
    rank: keyof XPGainPerRankProps;
    include?: number[];
    exclude?: number[];
    exclude_character_ids?: number[];
    isSameName?: boolean;
    limit?: number;
}

export type EnchantmentAccumulatorProps = {
    id: number;
    rank: RankProps;
    character_id: number;
}

export type EnchantmentAccumulatorPropsV2 = {
    id: number;
    character_id: number;
    count: number;
    user_id: number;
}

export type ComputedReturnType<T = EnchantmentAccumulatorProps> = {
    levelCounter: number;
    totalXpGain: number;
    accumulator: T[];
    r_exp: number;
    exp: number;
    reqExp: number;
    max_level?: number;
    has_reached_max_level?: boolean;
}