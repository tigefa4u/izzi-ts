import { MessageButton, MessageButtonStyleResolvable } from "discord.js";

export type ButtonOptions = {
    label?: string;
    emoji?: string;
    style?: MessageButtonStyleResolvable;
}

export type CreateButtonParams = (id: string, options?: ButtonOptions) => MessageButton