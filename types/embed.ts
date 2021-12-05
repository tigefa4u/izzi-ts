import { MessageAttachment, MessageButton, MessageEmbed } from "discord.js";

export interface CustomEmbedProps extends MessageEmbed {
    attachments: MessageAttachment[];
    buttons: MessageButton[];
    isConfirmation: boolean;
    isPagination: boolean;
    attachFiles: (attachments: MessageAttachment[]) => CustomEmbedProps;
    setButtons: (buttons: MessageButton[]) => CustomEmbedProps;
    setConfirmation: (bool: boolean) => CustomEmbedProps;
    setPagination: (bool: boolean) => CustomEmbedProps;
}