import { MessageButton, MessageButtonStyleResolvable } from "discord.js";

export type ButtonOptions = {
    label?: string;
    emoji?: string;
    style?: MessageButtonStyleResolvable;
    url?: string;
}

export type CreateButtonParams = (id: string, options?: ButtonOptions) => MessageButton