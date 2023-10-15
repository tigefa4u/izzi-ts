import { BattleProcessProps } from "@customTypes/adventure";
import transaction from "db/transaction";
import { emojiMap } from "emojis";
import { probability } from "helpers";
import { prepSendAbilityOrItemProcDescription } from "helpers/abilityProc";
import { getRelationalDiff } from "helpers/battle";
import {
	CHARACTER_LEVEL_EXTENDABLE_LIMIT,
	FODDER_RANKS,
} from "helpers/constants/constants";
import { ranksMeta } from "helpers/constants/rankConstants";
import loggers from "loggers";
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
	baseEnemyStats,
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
			baseEnemyStats,
			basePlayerStats,
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
	baseEnemyStats,
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
			baseEnemyStats,
			basePlayerStats,
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
	baseEnemyStats,
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
			baseEnemyStats,
			basePlayerStats,
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
	isRaid,
	multiplier,
	baseEnemyStats,
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

		let allowUptoLevel = (ranksMeta.ultimate.max_level || 70) + CHARACTER_LEVEL_EXTENDABLE_LIMIT;
		let allowMinLevel = ranksMeta.ultimate.max_level || 70 + 1;
		const allowedRans = [ ranksMeta.ultimate.rank_id, ranksMeta.mythical.rank_id ];
		// Do not add souls to ultimate level 70 cards.
		// allow souls to be added if the ult level is 70+
		if (card.rank_id === ranksMeta.mythical.rank_id) {
			allowUptoLevel = (ranksMeta.mythical.max_level || 70) + CHARACTER_LEVEL_EXTENDABLE_LIMIT;
			allowMinLevel = ranksMeta.mythical.max_level || 70;
		}
		if (
			isRaid &&
    	allowedRans.includes(card.rank_id) &&
      card.character_level < allowUptoLevel &&
      card.character_level >= allowMinLevel
		) {
			const chances = [ true, false ];
			const canStealSouls = chances[probability([ 50, 50 ])];
			if (canStealSouls && !FODDER_RANKS.includes(card.rank)) {
				const soulsToSeal =
          (opponentStats.cards.length || 0) * (multiplier || 1);
				desc =
          desc +
          `**${playerStats.name}'s ${titleCase(
          	card.name
          )}** has stolen __${soulsToSeal}__ Souls.`;

				if (soulsToSeal > 0) {
					playerStats.soulGainText = `• **${titleCase(
						card.name
					)}** has also gained __${soulsToSeal}__ Souls.`;
					card.souls = card.souls + soulsToSeal;
					transaction(async (trx) => {
						const updatedId = await trx.raw(`update collections set 
						souls = souls + ${soulsToSeal} where id = ${card.id} returning id`);
						if (!updatedId) {
							loggers.info("could not add souls to cid: ", card);
							return trx.rollback();
						}
						return trx.commit();
					}).catch((err) => {
						loggers.info("could not add souls to cid: ", card);
					});
					// updateCollection({ id: card.id }, { souls: card.souls });
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
			baseEnemyStats,
			basePlayerStats,
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
	baseEnemyStats,
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
			baseEnemyStats,
			basePlayerStats,
		});
	}
	const hasElectrocute = playerStats.cards.find(
		(c) => c?.abilityname === "electrocute"
	);

	if (!hasElectrocute) {
		if (opponentStats.totalStats.isStunned) {
			if (
				playerStats.totalStats.stormrazorResetOnRound &&
        round >= playerStats.totalStats.stormrazorResetOnRound
			) {
				opponentStats.totalStats.isStunned = false;
			}
		} else {
			const stunChance = [ 5, 100 ];
			const stuns = [ true, false ];
			if (stuns[probability(stunChance)]) {
				playerStats.totalStats.stormrazorResetOnRound = round + 1;
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
					baseEnemyStats,
					basePlayerStats,
				});
			}
		}
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
	baseEnemyStats,
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
			baseEnemyStats,
			basePlayerStats,
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};

export const skullBasher = ({
	playerStats,
	opponentStats,
	message,
	embed,
	round,
	isPlayerFirst,
	card,
	basePlayerStats,
	simulation,
	baseEnemyStats,
}: BattleProcessProps) => {
	if (!card || !card.itemStats) return;
	else if (round === 1) {
		playerStats.totalStats = processItemStats(
			playerStats.totalStats,
			card.itemStats
		);
		basePlayerStats.totalStats = playerStats.totalStats;
		const desc =
      `and has gained __${card.itemStats.vitality}__ **ATK** ` +
      "**Ability:** When the enemy **HP** drops below __10%__, increase the **ATK** of all allies by __95%__.";

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
			baseEnemyStats,
			basePlayerStats,
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
	if (!opponentStats.totalStats.originalHp) return;
	const hpRatio = Math.floor(opponentStats.totalStats.originalHp * (10 / 100));
	if (opponentStats.totalStats.strength < hpRatio) {
		const ratio = getRelationalDiff(playerStats.totalStats.vitality, 95);
		playerStats.totalStats.vitality = playerStats.totalStats.vitality + ratio;
		const desc =
      `**${titleCase(card.itemname || "")}** ${emojiMap(card.itemname)} ` +
      "is **Thirsty for Blood**, increasing **ATK** of all allies by __95%__";

		prepSendAbilityOrItemProcDescription({
			playerStats,
			enemyStats: opponentStats,
			card,
			message,
			embed,
			round,
			isDescriptionOnly: true,
			description: desc,
			totalDamage: 0,
			isPlayerFirst,
			isItem: true,
			simulation,
			baseEnemyStats,
			basePlayerStats,
		});

		return {
			playerStats,
			opponentStats,
			basePlayerStats,
		};
	}
};
