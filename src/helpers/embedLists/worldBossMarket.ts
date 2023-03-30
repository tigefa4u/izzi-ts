import { RandomCardProps } from "@customTypes/cards";
import { EmbedFieldData } from "discord.js";
import emoji from "emojis/emoji";
import { getRemainingTimer, numericWithComma } from "helpers";
import { STARTER_CARD_LEVEL, WORLD_BOSS_MARKET_CARD_RANK } from "helpers/constants";
import { titleCase } from "title-case";

export const createWorldBossMarketList = (
	array: RandomCardProps[],
	currentPage: number,
	perPage: number
) => {
	const fields = array.map((item, i) => {
		const dt = new Date(item.created_at);
		const endsAt = getRemainingTimer(
			new Date(dt.setDate(dt.getDate() + 15)).getTime()
		);
		return {
			name: `#${
				i + 1 + (currentPage - 1) * perPage
			} | **Level ${STARTER_CARD_LEVEL}** __${titleCase(WORLD_BOSS_MARKET_CARD_RANK)}__ ` +
            `${titleCase(item.name)} | ID: ${item.id}`,
			value: `Shard Cost: ${numericWithComma(item.shard_cost)} ${
				emoji.shard
			} | Expires: ${endsAt}` +
            `\nPurchase this card using \`\`wb shop ${item.id}\`\``,
		};
	});
	return fields as EmbedFieldData[];
};
