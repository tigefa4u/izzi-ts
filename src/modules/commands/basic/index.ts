import { BaseProps } from "../../../@types/command";
import { createEmbed } from "../../../commons/embeds";
import { BOT_INVITE_LINK } from "../../../env";

export const ping = async({ message, client }: BaseProps) => {
  message.channel.sendMessage(
    `:ping_pong: Ping: **\`\`${
      Date.now() - message.createdTimestamp
    }ms\`\`** WS: **\`\`${Math.round(client.ws.ping)}ms\`\`**`
  );
  return;
};
export const invite = async({ message, client }: BaseProps) => {
    const embed = createEmbed(message.member);
    embed.setAuthor("Izzi", client?.user?.displayAvatarURL())
        .setDescription(`Invite izzi into your server through the link:- ${BOT_INVITE_LINK}`);

    if (client.user) {
        embed.setThumbnail(client?.user?.displayAvatarURL())
            .setImage(client?.user?.displayAvatarURL());
    }
    message.channel.sendMessage(embed);
};