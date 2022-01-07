import { MessageActionRow, MessageAttachment, MessageEmbed } from "discord.js";

export interface CustomEmbedProps extends MessageEmbed {
    attachments: MessageAttachment[];
    buttons: MessageActionRow;
    isConfirmation: boolean;
    isPagination: boolean;
    attachFiles: (attachments: MessageAttachment[]) => CustomEmbedProps;
    setButtons: (buttons: MessageActionRow) => CustomEmbedProps;
    setConfirmation: (bool: boolean) => CustomEmbedProps;
    setPagination: (bool: boolean) => CustomEmbedProps;
}

export type EmbedProps = () => MessageEmbed;