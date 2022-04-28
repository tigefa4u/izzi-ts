import { Simulation } from "@customTypes/adventure";
import { AbilityProcDescriptionProps } from "@customTypes/battle";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { titleCase } from "title-case";
import { simulateBattleDescription } from "./battle";

export const prepSendAbilityOrItemProcDescription = async ({
	round,
	description = "",
	isDescriptionOnly,
	card,
	playerStats,
	enemyStats,
	message,
	embed,
	isPlayerFirst,
	isItem,
	simulation
}: AbilityProcDescriptionProps & { simulation: Simulation; }) => {
	const emotename = (isItem ? card?.itemname : card?.abilityname) || "";
	let updatedDescription = `**[ROUND ${round}]**\n${emoji.fast}`;
	if (isDescriptionOnly) {
		updatedDescription = `${updatedDescription} ${description}`;
	} else {
		updatedDescription = `${updatedDescription} **${playerStats.name} ${titleCase(
			card?.name || ""
		)}** ${isItem ? "is equipped with" : "uses"} __${titleCase(emotename)}__ ${emojiMap(emotename)} ${description}`;
	}

	const desc = await simulateBattleDescription({
		playerStats: isPlayerFirst ? playerStats : enemyStats,
		enemyStats: isPlayerFirst ? enemyStats : playerStats,
		description: updatedDescription,
		totalDamage: 0
	});

	simulation.rounds[round].descriptions.push({
		description: desc,
		delay: 1000
	});
	// FIXME: Need to catch somewhere
	// if (!hasEdited) {
	// 	throw new Error("Match Forfeit");
	// }
};