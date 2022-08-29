import { BattleProcessProps } from "@customTypes/adventure";
import { updateCollection } from "api/controllers/CollectionsController";
import { probability } from "helpers";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { ranksMeta } from "helpers/constants";
import { titleCase } from "title-case";
import { processItemStats } from "..";

export const duskbladeOfDraktharr = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      "**Ability:** Grants an additional **(75 + 30% bonus ATK Damage)**";

		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
			simulation,
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};

export const youmuusGhostblade = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      "it's **ATK** is increased by __60__ points and **EVA** by __12%__.";

		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
			simulation,
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};

export const navoriQuickblades = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      "**Ability:** Grants **(+60 ATK Damage)** and __20%__ **CRIT Chance**";

		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
			simulation,
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};

export const desolator = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	isRaid
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		let desc =
      "**Ability:** Your attacks reduce the enemy's **DEF** by __(-10)__ points)).";

	  if (isRaid && card.rank_id === ranksMeta.ultimate.rank_id) {
			const chances = [ true, false ];
			const canStealSouls = chances[probability([ 50, 50 ])];
			if (canStealSouls) {
				const soulsToSeal = opponentStats.cards.length || 0;
				desc =
		desc +
		`**${playerStats.name}'s ${titleCase(card.name)}** has stolen __${
			soulsToSeal
		}__ Souls.`;

				if (soulsToSeal > 0) {
					card.souls = card.souls + soulsToSeal;
					updateCollection({ id: card.id }, { souls: card.souls });
				}
			}
	  }

		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
			simulation,
		});
	}
	opponentStats.totalStats.defense = opponentStats.totalStats.defense - 10;

	return {
		playerStats,
		opponentStats,
		basePlayerStats,
	};
};

export const stormrazor = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc = "**Ability:** Grants a chance to **Paralyze** the enemy";

		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
			simulation,
		});
	}
	playerStats.totalStats.previousRound
		? playerStats.totalStats.previousRound++
		: null;
	if (round == playerStats.totalStats.previousRound) {
		if (opponentStats.totalStats.isStunned) {
			opponentStats.totalStats.isStunned = false;
		}
	}
	const stunChance = [ 5, 95 ];
	const stuns = [ true, false ];
	if (stuns[probability(stunChance)]) {
		playerStats.totalStats.previousRound = round;
		opponentStats.totalStats.isStunned = true;
		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: `**${opponentStats.name}** is __Stunned__, affected by **Stormrazor**`,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
			simulation,
		});
	}

	return {
		playerStats,
		opponentStats,
		basePlayerStats,
	};
};

export const krakenSlayer = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc = "**Ability:** Buff **Stats** of all allies by __80__ Points.";

		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: false,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
			simulation,
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};
