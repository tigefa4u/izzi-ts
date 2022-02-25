import { AbilityProcDescriptionProps } from "@customTypes/battle";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { titleCase } from "title-case";
import { simulateBattleDescription } from "./battle";

export const prepSendAbilityOrItemProcDescription = ({
	round,
	description = "",
	isDescriptionOnly,
	card,
	playerStats,
	enemyStats,
	message,
	embed,
	isPlayerFirst,
	isItem
}: AbilityProcDescriptionProps) => {
	const emotename = (isItem ? card?.itemname : card?.abilityname) || "";
	let updatedDescription = `**[ROUND ${round}]**\n${emoji.fast}`;
	if (isDescriptionOnly) {
		updatedDescription = `${updatedDescription} ${description}`;
	} else {
		updatedDescription = `${updatedDescription} **${titleCase(
			card?.name || ""
		)}** ${isItem ? "is equipped with" : "uses"} __${titleCase(emotename)}__ ${emojiMap(emotename)} ${description}`;
	}

	const hasEdited = simulateBattleDescription({
		playerStats: isPlayerFirst ? playerStats : enemyStats,
		enemyStats: isPlayerFirst ? enemyStats : playerStats,
		description: updatedDescription,
		embed,
		message,
		totalDamage: 0
	});

	if (!hasEdited) {
		throw new Error("Match Forfeit");
	}
};