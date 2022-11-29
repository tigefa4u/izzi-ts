import { GuildMemberResponseProps } from "@customTypes/guildMembers";
import { EmbedFieldData } from "discord.js";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";

export const createGuildMemberList = (
	array: GuildMemberResponseProps[],
	currentPage: number,
	perPage: number
) => {
	const fields: EmbedFieldData[] = [];
	array.map((member, i) => {
		fields.push({
			name: `\`\`${i + 1 + (currentPage - 1) * perPage}.\`\` ${
				member.username
			} (${member.user_tag}) **Level ${member.level}** ${
				member.is_leader
					? "| Clan Leader"
					: member.is_vice_leader
						? "| Clan Vice Leader"
						: member.is_admin
							? "| Clan Admin"
							: ""
			}`,
			value: `Total Donations: ${numericWithComma(member.max_donation)} ${
				emoji.gold
			} | Usable Gold: ${numericWithComma(member.donation || 0)} ${
				emoji.gold
			} | Supporter Points: ${member.supporter_points}`,
		});
	});
	return fields;
};
