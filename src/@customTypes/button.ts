import { MessageButton, MessageButtonStyleResolvable } from "discord.js";

type ButtonOptions = {
    label?: string;
    emoji?: string;
    style?: MessageButtonStyleResolvable;
}

export type CreateButtonParams = (id: string, options?: ButtonOptions) => MessageButton