import {
	BattleProcessProps,
	BattleStats,
	BattleUpdatedStats,
	PrepareBattleDescriptionProps,
	SimulateBattleProps,
} from "@customTypes/adventure";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { delay } from "helpers";
import { createBattleCanvas, prepareBattleDesc } from "helpers/adventure";
import { compare, simulateBattleDescription } from "helpers/battle";
import { BATTLE_ROUNDS_COUNT } from "helpers/constants";
import loggers from "loggers";
import { performance, PerformanceObserver } from "perf_hooks";
import { clone } from "utility";
import { BattleProcess } from "./battleProcess";
import { prepareCriticalHitChance, prepareEvadeHitChance } from "./chances";
import * as battlesPerChannel from "./battlesPerChannelState";

const timerify = performance.timerify(createBattleCanvas);

const obs = new PerformanceObserver((list) => {
	const entries = list.getEntriesByName("createBattleCanvas");
	loggers.info(
		entries[0].name +
      " took: " +
      list.getEntries()[0].duration.toFixed(3) +
      "ms"
	);
	obs.disconnect();
});
obs.observe({ entryTypes: [ "function" ] });

export const simulateBattle = async ({
	context,
	playerStats,
	enemyStats,
	title = "__TEAM BATTLE__",
}: SimulateBattleProps) => {
	if (!context.channel?.id) return;
	let battlesInChannel = battlesPerChannel.validateBattlesInChannel(context.channel.id);
	try {
		if (battlesInChannel === undefined) return;
		else battlesInChannel = battlesPerChannel.set(context.channel.id, battlesInChannel + 1)
			.get(context.channel.id);

		const basePlayerStats = clone(playerStats);
		const baseEnemyStats = clone(enemyStats);
		const description = prepareBattleDesc({
			playerStats: basePlayerStats,
			enemyStats: baseEnemyStats,
			totalDamage: 0,
		});
		const attachmentCards = [ ...playerStats.cards, ...enemyStats.cards ];
		// const canvas = await createBattleCanvas(attachmentCards);
		const canvas = await timerify(attachmentCards);
		if (!canvas) {
			throw new Error("Failed to create battle canvas");
		}
		const attachment = createAttachment(
			canvas.createJPEGStream(),
			"battle.jpg"
		);
		const embed = createEmbed()
			.setTitle(title)
			.setDescription(description)
			.setImage("attachment://battle.jpg")
			.attachFiles([ attachment ]);

		const damageDiff = 1;
		const enemyDamageDiff = 1;
		let totalDamage = 0;
		let roundStats: BattleStats | undefined;
		const message = await context.channel?.sendMessage(embed);
		if (!message) {
			context.channel?.sendMessage("Something went wrong with your battle");
			throw new Error("Message Object not found to edit battle");
		}
		for (let round = 1; round <= BATTLE_ROUNDS_COUNT; round++) {
			const isPlayerFirst = compare(
				playerStats.totalStats.dexterity,
				enemyStats.totalStats.dexterity
			);
			const statusDescription = `${emoji.hasmorespeed} **${
				isPlayerFirst ? playerStats.name : enemyStats.name
			}** has more __Speed__. It strikes first!`;
			const updatedDescription = `**[ROUND ${round}]**\n${statusDescription}`;
			const isEdited = await simulateBattleDescription({
				playerStats,
				enemyStats,
				description: updatedDescription,
				embed,
				message,
				totalDamage,
			});
			if (!isEdited) {
				roundStats = playerStats;
				roundStats.isForfeit = true;
				break;
			}
			await delay(1000);
			const checkIsDefeated = await simulatePlayerTurns({
				playerStats,
				enemyStats,
				baseEnemyStats,
				basePlayerStats,
				message,
				embed,
				description: updatedDescription,
				isPlayerFirst,
				round,
				totalDamage,
			});
			if (checkIsDefeated.totalDamage) {
				totalDamage = checkIsDefeated.totalDamage;
			}
			if (checkIsDefeated.defeated) {
				roundStats = checkIsDefeated.defeated;
				break;
			}
		}
		battlesPerChannel.set(context.channel.id, (battlesInChannel || 1) - 1);
		if (roundStats) {
			if (roundStats.id === playerStats.id) {
				roundStats.isVictory = false;
			} else {
				roundStats.isVictory = true;
			}
			roundStats.totalDamage = totalDamage;
		}
		if (roundStats?.isForfeit) {
			context.channel?.sendMessage("You have forfeit the battle");
			return { isForfeit: roundStats.isForfeit };
		}
		return roundStats;
	} catch (err) {
		battlesPerChannel.autoClear();
		loggers.error(
			"modules.commands.rpg.adventure.battle.simulateBattle(): something went wrong",
			err
		);
		return;
	}
};

async function simulatePlayerTurns({
	playerStats,
	enemyStats,
	message,
	embed,
	description,
	isPlayerFirst,
	round,
	basePlayerStats,
	baseEnemyStats,
	totalDamage,
}: PrepareBattleDescriptionProps &
  Omit<BattleProcessProps, "opponentStats"> & {
    message: Message;
  }) {
	let defeated;
	for (let i = 0; i < 2; i++) {
		const criticalHitChances = prepareCriticalHitChance({
			isPlayerFirst,
			playerStats,
			enemyStats,
			totalDamage,
		});
		const evadeHitChances = prepareEvadeHitChance({
			isPlayerFirst,
			playerStats,
			enemyStats,
			totalDamage,
		});
		playerStats = {
			...criticalHitChances.playerStats,
			...evadeHitChances.playerStats,
		};
		enemyStats = {
			...criticalHitChances.enemyStats,
			...evadeHitChances.enemyStats,
		};
		const updatedStats = await BattleProcess({
			baseEnemyStats,
			basePlayerStats,
			isPlayerFirst,
			opponentStats: isPlayerFirst ? enemyStats : playerStats,
			playerStats: isPlayerFirst ? playerStats : enemyStats,
			embed,
			round,
			message
		});
		if (updatedStats.forfeit) {
			defeated = playerStats;
			defeated.isForfeit = true;
			break;
		}
		basePlayerStats = updatedStats.basePlayerStats;
		baseEnemyStats = updatedStats.baseEnemyStats;

		const damageDealt = updatedStats.damageDealt || 0;
		if (isPlayerFirst) {
			totalDamage += damageDealt;
		}
		const battleDescription = updateBattleDesc({
			isPlayerFirst,
			round,
			turn: i,
			damageDealt,
			damageDiff: updatedStats.damageDiff,
			enemyStats,
			playerStats,
			opponentStats: updatedStats.opponentStats,
			description,
			isCriticalHit: updatedStats.isCriticalHit,
		});
		const isEdited = await simulateBattleDescription({
			playerStats,
			enemyStats,
			description: battleDescription,
			embed,
			message,
			totalDamage,
		});
		if (!isEdited) {
			defeated = playerStats;
			defeated.isForfeit = true;
			break;
		}
		isPlayerFirst = !isPlayerFirst;
		await delay(1000);
		if (updatedStats.damageDiff <= 0) {
			defeated = getDefeated({
				updatedStats,
				playerStats,
				enemyStats,
				baseEnemyStats,
				basePlayerStats,
				round,
				embed,
				isPlayerFirst,
				message
			});
			break;
		} else if (round === BATTLE_ROUNDS_COUNT && i === 1) {
			defeated = getDefeated({
				updatedStats,
				playerStats,
				enemyStats,
				baseEnemyStats,
				basePlayerStats,
				round,
				embed,
				isPlayerFirst,
				message
			});
			break;
		}
	}
	return {
		defeated,
		totalDamage,
	};
}

function updateBattleDesc({
	isPlayerFirst,
	turn,
	round,
	enemyStats,
	damageDealt,
	opponentStats,
	playerStats,
	description,
	damageDiff,
	isCriticalHit,
}: {
  turn: number;
  isPlayerFirst: boolean;
  playerStats: BattleStats;
  enemyStats: BattleStats;
  opponentStats: BattleStats;
  damageDealt: number;
  round: number;
  description?: string;
  damageDiff: number;
  isCriticalHit?: boolean;
}) {
	const desc = `${turn === 0 ? `${description}\n` : `**[ROUND ${round}**]\n`}${
		emoji.fast
	} **${
		isPlayerFirst ? playerStats.name : enemyStats.name
	}** deals __${damageDealt}__ damage ${
		isCriticalHit ? "**CRITICAL HIT**" : ""
	} ${
		opponentStats.totalStats.effective < 1
			? "it was __Super Effective!__"
			: opponentStats.totalStats.effective > 1
				? "but it was not very effective..."
				: ""
	}\n${
		damageDiff !== 0 && turn === 0
			? `${
				isPlayerFirst ? enemyStats.name : playerStats.name
			} strikes back fiercely! ${emoji.angry}`
			: ""
	}`;
	return desc;
}

function getDefeated({ updatedStats, playerStats, enemyStats }: Omit<BattleProcessProps, "opponentStats"> & {
    enemyStats: BattleStats;
    updatedStats: BattleUpdatedStats;
}) {
	let defeated;
	let compareWith;
	if (updatedStats.opponentStats.id === playerStats.id) {
		compareWith = enemyStats;
	} else {
		compareWith = playerStats;
	}
	if (compareHpPercent(updatedStats.opponentStats.totalStats, compareWith.totalStats)) {
		defeated = compareWith;
	} else {
		defeated = updatedStats.opponentStats;
	}

	return defeated;
}

function compareHpPercent(
	player: BattleStats["totalStats"],
	opponent: BattleStats["totalStats"]
) {
	if (player.strength <= 0) {
		return false;
	}
	if (
		calculatePercent(player.strength, player.originalHp || 0) >
    calculatePercent(opponent.strength, opponent.originalHp || 0)
	) {
		return true;
	}
	return false;
}

function calculatePercent(x: number, y: number) {
	return Math.floor((x / y) * 100);
}
