import { AuthorProps, ChannelProp } from "@customTypes";
import { CollectionProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { Client, MessageEmbed } from "discord.js";

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
            name?: string;
            is_fodder?: boolean;
            count: number;
            character_id: number;
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

export type AddCardsToTradeProps = {
    collections: CollectionProps[];
    embed: MessageEmbed;
    channel: ChannelProp;
    tradeId: string;
    author: AuthorProps;
    client: Client;
    args: string[];
  };