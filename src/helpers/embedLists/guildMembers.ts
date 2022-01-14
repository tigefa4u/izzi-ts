import { GuildMemberResponseProps } from "@customTypes/guildMembers";
import { EmbedFieldData } from "discord.js";
import emoji from "emojis/emoji";

export const createGuildMemberList = (array: GuildMemberResponseProps[], currentPage: number, perPage: number) => {
	const fields: EmbedFieldData[] = [];
	array.map((member, i) => {
		fields.push({
			name: `\`\`${i + 1 + (currentPage - 1) * perPage}.\`\` ${
				member.username
			} (${member.user_tag}) **Level ${member.level}** ${
				member.is_leader
					? "| Clan Leader"
					: member.is_vice_leader
						? "| Clan Vice Leader" : ""
			}`,
			value: `Total Donations: ${
				member.max_donation
			} ${emoji.gold} | Usable Gold: ${member.donation || 0} ${emoji.gold}`,
		});
	});
	return fields;
};