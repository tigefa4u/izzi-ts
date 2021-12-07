// import { MessageAttachment, MessageButton, MessageEmbed } from "discord.js";
// import { CustomEmbedProps } from "../../../types/embed";

import { Message, MessageEmbed } from "discord.js";
import { EmbedProps } from "../../@types/embed";

// class CustomEmbed extends MessageEmbed implements CustomEmbedProps {
//     embed: MessageEmbed;
//     attachments: MessageAttachment[] = [];
//     isConfirmation = false;
//     isPagination= false;
//     buttons: MessageButton[] = [];
//     constructor() {
//         super();
//         this.embed = new MessageEmbed();
//     }
//     public attachFiles(attachments: MessageAttachment[]) {
//         this.attachments = attachments;
//         return this;
//     }
//     public setButtons(buttons: MessageButton[]) {
//         this.buttons = buttons;
//         return this;
//     }
//     public setConfirmation(bool: boolean) {
//         this.isConfirmation = bool;
//         return this;
//     }
//     public setPagination(bool: boolean) {
//         this.isPagination = bool;
//         return this;
//     }
// }

// export default CustomEmbed;

export const createEmbed: EmbedProps = (member) => {
    const embed = new MessageEmbed();
    member?.displayColor && embed.setColor(member?.displayColor);
    return embed;
};