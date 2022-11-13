import { ReferralProps } from "@customTypes/referrals";
import { EmbedFieldData } from "discord.js";

export const createReferralsList = (array: (ReferralProps & { username: string; })[]) => {
	const field: EmbedFieldData[] = [];
	array.map((item) => {
		field.push({
			name: `Referred by ${item.username}`,
			value: `ID: (${item.user_tag})`
		});
	});
	return field;
};