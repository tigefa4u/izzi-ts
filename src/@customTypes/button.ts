import { ChannelProp } from "@customTypes";
import { Client, Message, MessageButton, MessageButtonStyleResolvable } from "discord.js";

export type ButtonOptions = {
    label?: string;
    emoji?: string;
    style?: MessageButtonStyleResolvable;
    url?: string;
    isConsole?: boolean;
}

export type CreateButtonParams = (id: string, options?: ButtonOptions) => MessageButton

export type CustomButtonInteractionParams = {
    channel: ChannelProp;
    user_tag: string;
    client: Client;
    id: string;
    message: Message;
}