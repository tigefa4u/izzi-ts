import { AuthorProps, ChannelProp } from "@customTypes";
import {
	BattleStats,
	PrepareBattleDescriptionProps,
} from "@customTypes/adventure";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import { randomNumber } from "helpers";
import gt from "lodash/gt";
import loggers from "loggers";
import { clone } from "utility";
import { prepareBattleDesc } from "./adventure";
import {
	ABILITY_BUFF_MAX_PERCENT, ABILITY_DEBUFF_MAX_PERCENT, BATTLE_TYPES, DPR_MAX_BUFF, MANA_PER_BATTLE 
} from "./constants/constants";

export const compare = (x1: number, x2: number) => {
	return gt(x1, x2);
};

function capStatBuff(x1: number, x2: number) {
	const maxBuff = Math.ceil((ABILITY_BUFF_MAX_PERCENT / 100) * x2);
	const buffCap = x2 + maxBuff;
	if (x1 > buffCap) {
		return Math.ceil(buffCap);
	}
	return x1;
}

function capStatDeBuff(x1: number, x2: number) {
	const maxDebuff = Math.ceil((ABILITY_DEBUFF_MAX_PERCENT / 100) * x2);
	if (x1 < maxDebuff) {
		return maxDebuff;
	}
	return x1;
}

type B = BattleStats["totalStats"];
export function processStatBuffCap(stats: B, baseStats: B) {
	stats.vitality = capStatBuff(stats.vitality, baseStats.vitality);
	stats.defense = capStatBuff(stats.defense, baseStats.defense);
	// stats.intelligence = capStatBuff(
	// 	stats.intelligence,
	// 	baseStats.intelligence
	// );
	stats.dexterity = capStatBuff(stats.dexterity, baseStats.dexterity);
	return stats;
}

export function processStatDeBuffCap(stats: B, baseStats: B) {
	stats.vitality = capStatDeBuff(stats.vitality, baseStats.vitality);
	stats.defense = capStatDeBuff(stats.defense, baseStats.defense);
	// stats.intelligence = capStatDeBuff(
	// 	stats.intelligence,
	// 	baseStats.intelligence
	// );
	stats.dexterity = capStatDeBuff(stats.dexterity, baseStats.dexterity);
	if (stats.effective <= 0) stats.effective = 1;
	if (stats.accuracy <= 0) stats.accuracy = 1;
	if (stats.critical <= 0) stats.critical = 1;
	return stats;
}

export const simulateBattleDescription = async ({
	playerStats,
	enemyStats,
	description,
}: PrepareBattleDescriptionProps) => {
	const desc = prepareBattleDesc({
		playerStats,
		enemyStats,
		description,
		totalDamage: 0,
	});
	// if (!embed || !embed.title || !embed.description)
	// 	throw new Error("Embed required to edit battle!");
	// const newEmbed = recreateBattleEmbed(embed.title, embed.description);
	// if (!message) throw new Error("Message Object required to edit battle!");
	// newEmbed.setDescription(desc);
	// if (message.editable) {
	// 	try {
	// 		await message.editMessage(newEmbed, { reattachOnEdit: true });
	// 	} catch (err) {
	// 		loggers.error("helpers.battle.simulateBattleDescription: Battle embed update failed: ", err);
	// 		return;
	// 	}

	// 	return { edited: true };
	// }
	return desc;
};

export function recreateBattleEmbed(title: string, description: string) {
	return createEmbed()
		.setTitle(title)
		.setDescription(description)
		.setImage("attachment://battle.jpg");
}

export const getPlayerDamageDealt = (
	playerTotalStats: BattleStats["totalStats"],
	enemyTotalStats: BattleStats["totalStats"],
	round = 1
) => {
	// let modifiers = playercrit * playeraccuracy * effectiveness * random(0.85, 1);
	// (((((2*2)/5) + 2) * vitality * (vitality/enemyDefense))/50 + 2) * modifiers; // wont work damage too low
	// (1+(a.atk*0.01)) * a.atk/Math.max(1,b.def) * modifiers
	// (atk**2/(atk + def)) * modifiers (currently in use)
	const {
		vitality,
		isCriticalHit,
		effective,
		criticalDamage: critDamage,
	} = playerTotalStats;
	const { defense } = enemyTotalStats;
	const modifiers =
    (isCriticalHit ? (critDamage > 1 ? critDamage : 1.5) : 1) *
    // accuracy *
    (effective ? effective : 1) *
    randomNumber(0.87, 1, true); // This was 0.85 before
	const atk = clone(Math.floor(vitality));
	const def = clone(Math.floor(defense));


	/**
	 * Rework: INT based damage buff
	 * Use DPR (damage per round) to deal additional damage
	 * based on INT. DPR is already in %
	//  */
	// if (playerTotalStats.dpr <= 0) playerTotalStats.dpr = 0;
	// if (enemyTotalStats.dpr <= 0) enemyTotalStats.dpr = 0;
	// atk = atk + Math.floor(playerTotalStats.intelligence * Number(playerTotalStats.dpr.toFixed(2))); // prev - 6 (35)
	// def = def + Math.floor(enemyTotalStats.intelligence * Number(enemyTotalStats.dpr.toFixed(2))); // prev - 10 (40)
	// let damage = Math.round(
	//   0.5 * vitality * (vitality / defense) * modifiers + 1
	// );
	// testing
	// let damage = Math.floor((1 + (vitality * 0.01)) * (vitality/Math.max(1, defense)) * modifiers * 100);
	let damage = Math.floor((atk ** 2 / (atk + def)) * modifiers);
	if (damage <= 0) damage = randomNumber(100, 400);

	/**
	 * This logic is added to make sure
	 * the DOT is smaller after r10
	 */
	let roundCount = round;
	if (roundCount > 10) {
		const diff = round - 10;
		roundCount = 10 + (diff / 2);
	}
	// linear damage over time
	const linearDOT = Math.floor(atk * .0375 * roundCount * (effective < 1 ? effective : 1));
	damage = damage + linearDOT;
	/**
	 * Consider a damage over time linear increase based on atk & round
	 */

	// True damage reduction
	// for Bone Plating
	if (enemyTotalStats.trueDamageReductionPercent && enemyTotalStats.trueDamageReductionPercent["bone plating"]) {
		const reldiff = getRelationalDiff(damage, enemyTotalStats.trueDamageReductionPercent["bone plating"].percent);
		if (reldiff > 0 && reldiff < damage) {
			damage = damage - reldiff;
		}
	}
	return Math.ceil(damage);
};

/**
 * Multiple the result by 100 to get actual %
 * @param x1 number
 * @param x2 number
 * @returns float (decimal form percent)
 */
export const getPercentOfTwoNumbers = (x1: number, x2:  number) => x1 / x2;

export const relativeDiff = (
	updatedHp: number,
	originalHp: number,
	customHp = 12
) => Math.ceil(customHp * (updatedHp / originalHp));

export const processEnergyBar = (playerTotalStats: Pick<BattleStats["totalStats"], "energy" | "dpr">) => {
	if (playerTotalStats.dpr > DPR_MAX_BUFF) {
		playerTotalStats.dpr = DPR_MAX_BUFF;
	}
	const dpr = playerTotalStats.dpr;
	if (dpr <= 0) {
		playerTotalStats.energy = Array(playerTotalStats.energy.length).fill(emoji.dprrunner2);
		playerTotalStats.energy[0] = emoji.dprrunner1;
		playerTotalStats.energy[playerTotalStats.energy.length - 1] = emoji.dprrunner3;
	} else {
		let relativeDiff = Math.ceil(playerTotalStats.energy.length * dpr);
		if (relativeDiff > playerTotalStats.energy.length) relativeDiff = playerTotalStats.energy.length;
		let res = Array(relativeDiff).fill(emoji.dpr2);
		res[0] = emoji.dpr1;
		const emptyEnergyDiff = playerTotalStats.energy.length - res.length;
		if (emptyEnergyDiff <= 0) {
			res[res.length - 1] = emoji.dpr3;
		} else if (emptyEnergyDiff === 1) {
			res.push(emoji.dprrunner3);
		} else if (emptyEnergyDiff > 1) {
			const result = Array(emptyEnergyDiff).fill(emoji.dprrunner2);
			result[result.length - 1] = emoji.dprrunner3;
			res = [ ...res, ...result ];
		}

		playerTotalStats.energy = res;
	}
	return playerTotalStats;
};

export const processHpBar = (
	playerTotalStats: Pick<BattleStats["totalStats"], "health" | "strength">,
	damageDiff: number
) => {
	const mediumHealthRatio = playerTotalStats.health.length * (50 / 100);
	const lowHealthRatio = playerTotalStats.health.length * (30 / 100);
	let strCheck = playerTotalStats.strength;
	if (strCheck < 0) strCheck = 0;
	playerTotalStats.health.map((_, i) => {
		if (damageDiff <= playerTotalStats.health.length - 1 && i <= damageDiff) {
			if (i === playerTotalStats.health.length - 1)
				playerTotalStats.health[playerTotalStats.health.length - 1] = emoji.g3;
			else {
				if (i === 0) playerTotalStats.health[0] = emoji.g1;
				else playerTotalStats.health[i] = emoji.g2;
			}
		}
		if (damageDiff < mediumHealthRatio && i <= damageDiff) {
			if (i === 0) playerTotalStats.health[0] = emoji.y1;
			else playerTotalStats.health[i] = emoji.y2;
		}
		if (damageDiff < lowHealthRatio && i <= damageDiff) {
			if (i === 0) playerTotalStats.health[0] = emoji.r1;
			else playerTotalStats.health[i] = emoji.r2;
		}
		if (strCheck > 0 && damageDiff <= 0) {
			playerTotalStats.health[0] = emoji.r1;
		}
		if (i > damageDiff || damageDiff === 0) {
			playerTotalStats.health[i] = emoji.e2;
			if (i === 0) playerTotalStats.health[0] = emoji.e1;
			if (i === playerTotalStats.health.length - 1)
				playerTotalStats.health[playerTotalStats.health.length - 1] = emoji.e3;
		}
	});
	playerTotalStats.strength = strCheck;
	return playerTotalStats;
};

export const sendBattleStatusEmbed = (
	author: AuthorProps,
	client: Client,
	channel: ChannelProp,
	desc = "Better luck next time",
	title = `Defeated ${emoji.cry}`
) => {
	const embed = createEmbed(author, client)
		.setTitle(title)
		.setDescription(desc);

	channel?.sendMessage(embed);
	return;
};

export const getRelationalDiff = (x1: number, x2: number) => {
	return Math.floor(x1 * (x2 / 100));
};

export const refetchAndUpdateUserMana = async (
	id: string,
	manaCost = MANA_PER_BATTLE,
	battleType = BATTLE_TYPES.FLOOR
) => {
	const user = await getRPGUser({ user_tag: id });
	if (!user) {
		throw new Error("User not found, unable to update mana: " + id);
	}
	const params = {};
	if (battleType === BATTLE_TYPES.DUNGEON) {
		user.dungeon_mana = user.dungeon_mana - manaCost;
		if (user.dungeon_mana < 0) user.dungeon_mana = 0;
		Object.assign(params, { dungeon_mana: user.dungeon_mana });
	} else {
		user.mana = user.mana - manaCost;
		if (user.mana < 0) user.mana = 0;
		Object.assign(params, { mana: user.mana });
	}
	await updateRPGUser({ user_tag: user.user_tag }, params);
};

export const validateFiveMinuteTimer = async (cd: {
  timestamp: number;
  key: string;
}) => {
	const dt = new Date().valueOf();
	if (new Date(cd.timestamp).valueOf() < dt) {
		await Cache.del(cd.key);
	}
	return;
};
