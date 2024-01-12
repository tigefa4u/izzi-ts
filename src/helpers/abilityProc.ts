import { Simulation } from "@customTypes/adventure";
import { AbilityProcDescriptionProps } from "@customTypes/battle";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { generateUUID } from "helpers";
import { titleCase } from "title-case";
import { processStatDeBuffCap, simulateBattleDescription } from "./battle";

export const prepSendAbilityOrItemProcDescription = async ({
	round,
	description = "",
	isDescriptionOnly,
	card,
	playerStats,
	enemyStats,
	isPlayerFirst,
	isItem,
	simulation,
	basePlayerStats,
	baseEnemyStats
}: AbilityProcDescriptionProps & { simulation: Simulation; }) => {
	if (card?.metadata?.nickname) card.name = card.metadata.nickname;
	const emotename = (isItem ? card?.itemname : card?.abilityname) || "";
	let updatedDescription = `${emoji.up} **[Round ${round}]**\n${emoji.fast}`;
	if (isDescriptionOnly) {
		updatedDescription = `${updatedDescription} ${description}`;
	} else {
		updatedDescription = `${updatedDescription} **${playerStats.name} ${titleCase(
			card?.name || ""
		)}** ${isItem ? "is equipped with" : "uses"} __${titleCase(emotename)}__ ${emojiMap(emotename)} ${description}`;
	}

	// The actual values are fixed in 'battleProcess' file
	// this is for visual fix if the stats are negative
	playerStats.totalStats = processStatDeBuffCap(
		playerStats.totalStats,
		basePlayerStats.totalStats
	);
	enemyStats.totalStats = processStatDeBuffCap(
		enemyStats.totalStats,
		baseEnemyStats.totalStats
	);
	const desc = await simulateBattleDescription({
		playerStats: isPlayerFirst ? playerStats : enemyStats,
		enemyStats: isPlayerFirst ? enemyStats : playerStats,
		description: updatedDescription,
		totalDamage: 0
	});

	simulation.rounds[round].descriptions.push({
		description: desc,
		delay: 1000,
		rawDescription: updatedDescription,
		showUpdatedDescription: true,
		id: generateUUID(4)
	});
	// FIXME: Need to catch somewhere
	// if (!hasEdited) {
	// 	throw new Error("Match Forfeit");
	// }
};

export const calculateSkillProcRound = (procRound: number, reduceSkillCooldownBy?: number) => {
	let proc = procRound;
	if (reduceSkillCooldownBy && reduceSkillCooldownBy > 0) proc = proc - reduceSkillCooldownBy;
	if (proc <= 0) proc = procRound;
	return proc;
};