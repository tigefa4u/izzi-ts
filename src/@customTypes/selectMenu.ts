import { AuthorProps, ChannelProp } from "@customTypes";
import { Client, MessageSelectMenu, MessageSelectOptionData } from "discord.js";

export type SelectMenuOptions = {
    menuOptions: MessageSelectOptionData[];
    extras?: {
        placeholder: string;
    }
}
export type createSelectMenuProps = (id: string, options: SelectMenuOptions) => MessageSelectMenu;

export type SelectMenuCallbackParams<T> = {
    channel: ChannelProp;
    author: AuthorProps;
    client: Client;
    extras?: T
}