import { Message, MessageEmbed, TextChannel } from "discord.js";
import { CustomEmbedProps } from "../@types/embed";

type Props = TextChannel;

const sendMessage: (channel: Props, content: string | CustomEmbedProps) => Promise<Message> = function(channel: Props, content) {
    const responseObj = {};
    if (typeof content === "string") {
        Object.assign(responseObj, { content });
    }
    if (content instanceof MessageEmbed) {
        Object.assign(responseObj, { embeds: [content] });
        if (content.attachments) {
            Object.assign(responseObj, { files: [ ...content.attachments] });
        }
    }
    return channel.send(responseObj);
};

export default sendMessage;