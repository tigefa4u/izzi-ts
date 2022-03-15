import { ChannelProp, FilterProps, XPGainPerRankProps } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";

export type ProcessEnchantmentProps = {
    reqExp: number;
    card: CollectionCardInfoProps;
    user_id: number;
    row_number?: number | number[];
    exclude_ids?: number[];
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
}

export type EnchantmentBucketPayload = {
    bucket: XPGainPerRankProps;
    rank: keyof XPGainPerRankProps;
    include?: number[];
    exclude?: number[];
    isSameName?: boolean;
}

export type EnchantmentAccumulatorProps = {
    id: number;
    rank: string;
    character_id: number;
}

export type ComputedReturnType = {
    levelCounter: number;
    totalXpGain: number;
    accumulator: EnchantmentAccumulatorProps[];
    r_exp: number;
    exp: number;
    reqExp: number;
}