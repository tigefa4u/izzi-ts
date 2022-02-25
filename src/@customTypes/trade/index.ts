import { AuthorProps, ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";

export type TradeQueueProps = {
    [key: string]: {
        user_id: number;
        user_tag: string;
        username: string;
        hasConfirmed: boolean;
        queue: {
            id: number;
            user_id: number;
            rank: string;
        }[];
        gold: number;
    }
}

export type TradeActionProps = {
    tradeQueue: TradeQueueProps;
    tradeId: string;
    author: AuthorProps;
    channel: ChannelProp;
} & Omit<BaseProps, "options" | "context">