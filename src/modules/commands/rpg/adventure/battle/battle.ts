import {
	BattleProcessProps,
	BattleStats,
	BattleUpdatedStats,
	PrepareBattleDescriptionProps,
	SimulateBattleProps,
	Simulation,
} from "@customTypes/adventure";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import emoji from "emojis/emoji";
import { delay } from "helpers";
import { createBattleCanvas, prepareBattleDesc } from "helpers/adventure";
import { compare, recreateBattleEmbed, simulateBattleDescription } from "helpers/battle";
import { BATTLE_ROUNDS_COUNT } from "helpers/constants";
import loggers from "loggers";
import { performance, PerformanceObserver } from "perf_hooks";
import { clone } from "utility";
import { BattleProcess } from "./battleProcess";
import { prepareCriticalHitChance, prepareEvadeHitChance } from "./chances";
import * as battlesPerChannel from "./battlesPerChannelState";
import { CollectionCardInfoProps } from "@customTypes/collections";

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
	isRaid,
}: SimulateBattleProps & { isRaid?: boolean }) => {
	if (!context.channel?.id) return;
	let battlesInChannel = battlesPerChannel.validateBattlesInChannel(
		context.channel.id
	);
		// Create an object that stores all data needed for simulation
	const simulation = { title, } as Simulation;
	try {
		if (battlesInChannel === undefined) return;
		else
			battlesInChannel = battlesPerChannel
				.set(context.channel.id, battlesInChannel + 1)
				.get(context.channel.id);

		const basePlayerStats = clone(playerStats);
		const baseEnemyStats = clone(enemyStats);
		const description = prepareBattleDesc({
			playerStats: basePlayerStats,
			enemyStats: baseEnemyStats,
			totalDamage: 0,
		});
		const attachmentCards = [ ...playerStats.cards, ...enemyStats.cards ];

		simulation.rounds = {
			0: {
				descriptions: [ {
					description,
					delay: 0 
				} ],
				canSimulateRound: true,
				round: 0
			}
		};

		let totalDamage = 0;
		let roundStats: BattleStats | undefined;
		for (let round = 1; round <= BATTLE_ROUNDS_COUNT; round++) {
			const isPlayerFirst = compare(
				playerStats.totalStats.dexterity,
				enemyStats.totalStats.dexterity
			);
			const statusDescription = `${emoji.hasmorespeed} **${
				isPlayerFirst ? playerStats.name : enemyStats.name
			}** has more __Speed__. It strikes first!`;
			const updatedDescription = `**[ROUND ${round}]**\n${statusDescription}`;
			
			const desc = await simulateBattleDescription({
				playerStats,
				enemyStats,
				description: updatedDescription,
				totalDamage,
			});
			simulation.rounds[round] = {
				descriptions: [ {
					description: desc,
					delay: 1000
				} ],
				canSimulateRound: true,
				round
			};
			roundStats = playerStats;
			const checkIsDefeated = await simulatePlayerTurns({
				playerStats,
				enemyStats,
				baseEnemyStats,
				basePlayerStats,
				description: updatedDescription,
				isPlayerFirst,
				round,
				totalDamage,
				isRaid,
				simulation
			});
			playerStats = checkIsDefeated.playerStats;
			enemyStats = checkIsDefeated.enemyStats;
			if (checkIsDefeated.totalDamage) {
				totalDamage = checkIsDefeated.totalDamage;
			}
			if (checkIsDefeated.defeated) {
				roundStats = checkIsDefeated.defeated;
				break;
			}
		}
		battlesPerChannel.set(context.channel.id, (battlesInChannel || 1) - 1);
		roundStats = await visualizeSimulation({
			simulation,
			context,
			attachments: attachmentCards,
			roundStats: clone(roundStats)
		});
		if (roundStats) {
			if (roundStats.id === playerStats.id) {
				roundStats.isVictory = false;
			} else {
				roundStats.isVictory = true;
			}
			roundStats.totalDamage = totalDamage;
		}
		if (roundStats?.isForfeit) {
			simulation.isForfeit = true;
			context.channel?.sendMessage("You have forfeit the battle");
			return { isForfeit: roundStats.isForfeit };
		}
		return roundStats;
	} catch (err) {
		simulation.hasCrashed = true;
		battlesPerChannel.autoClear();
		loggers.error(
			"modules.commands.rpg.adventure.battle.simulateBattle(): something went wrong",
			err
		);
		return;
	}
};

type V = {
	simulation: Simulation;
	context: SimulateBattleProps["context"];
	attachments: (CollectionCardInfoProps | undefined)[];
	roundStats?: BattleStats;
}
async function visualizeSimulation({ simulation, context, attachments, roundStats }: V) {

	const canvas = await timerify(attachments);
	if (!canvas) {
		throw new Error("Failed to create battle canvas");
	}
	const attachment = createAttachment(
		canvas.createJPEGStream(),
		"battle.jpg"
	);

	const rounds = simulation.rounds;
	const embed = createEmbed()
		.setTitle(simulation.title)
		.setDescription(rounds["0"].descriptions[0].description)
		.attachFiles([ attachment ])
		.setImage("attachment://battle.jpg");

	const message = await context.channel?.sendMessage(embed);
	if (!message) {
		context.channel?.sendMessage("Something went wrong with your battle");
		throw new Error("Message Object not found to edit battle");
	}

	const roundKeys = Object.keys(rounds);
	roundKeys.shift();
	for (const round of roundKeys) {
		for (const data of rounds[round].descriptions) {
			const newEmbed = recreateBattleEmbed(embed.title || "", data.description);
			if (message.editable) {
				try {
					await message.editMessage(newEmbed, { reattachOnEdit: true });
					if (data.delay) {
						await delay(data.delay);
					}
				} catch (err) {
					if (roundStats) roundStats.isForfeit = true;
					break;
				}
			} else {
				if (roundStats) roundStats.isForfeit = true;
				break;
			}
		}
	}

	return roundStats;
}

function boostRaidBoss({
	enemyStats,
	round,
}: Pick<PrepareBattleDescriptionProps, "enemyStats"> & { round: number }) {
	if (!enemyStats.totalStats.critical) enemyStats.totalStats.critical = 1;
	const incRatio = enemyStats.totalStats.critical * ((5 * round) / 100);
	enemyStats.totalStats.critical = enemyStats.totalStats.critical + incRatio;
	const critDmgRatio =
    enemyStats.totalStats.criticalDamage * ((3 * round) / 100);
	enemyStats.totalStats.criticalDamage =
    enemyStats.totalStats.criticalDamage + critDmgRatio;
	return {
		enemyStats,
		desc: `**${enemyStats.name}** has entered **Rage Mode** ${emoji.angry}, ` +
		"its **Critical Hit** chance and **Critical Hit Damage** will increase over time!" 
	};
}

async function simulatePlayerTurns({
	playerStats,
	enemyStats,
	description,
	isPlayerFirst,
	round,
	basePlayerStats,
	baseEnemyStats,
	totalDamage,
	isRaid,
	simulation
}: PrepareBattleDescriptionProps &
  Omit<BattleProcessProps, "opponentStats"> & {
    isRaid?: boolean;
  }) {
	let defeated;
	for (let i = 0; i < 2; i++) {
		if (isRaid && round >= 10) {
			const boost = boostRaidBoss({
				enemyStats,
				round,
			});
			enemyStats = boost.enemyStats;
			if (round === 10 && i === 1) {
				const desc = await simulateBattleDescription({
					playerStats,
					enemyStats,
					description: boost.desc,
					totalDamage,
				});
				simulation.rounds[round].descriptions.push({
					description: desc,
					delay: 0
				});
			}
		}
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
			round,
			simulation
		});
		if (updatedStats.forfeit) {
			// Should never execute
			defeated = playerStats;
			defeated.isForfeit = true;
			simulation.rounds[round].canSimulateRound = false;
			simulation.isForfeit = true;
			break;
		}
		if (isPlayerFirst) {
			playerStats = updatedStats.playerStats;
			enemyStats = updatedStats.opponentStats;
		} else {
			playerStats = updatedStats.opponentStats;
			enemyStats = updatedStats.playerStats;
		}
		basePlayerStats = updatedStats.basePlayerStats;
		baseEnemyStats = updatedStats.baseEnemyStats;

		const damageDealt = updatedStats.damageDealt || 0;
		const abilityDamage = updatedStats.abilityDamage || 0;
		if (isPlayerFirst) {
			totalDamage += damageDealt;
			totalDamage += abilityDamage;
		}
		if (updatedStats.isAbilityDefeat) {
			defeated = updatedStats.opponentStats;
			break;
		} else if (updatedStats.isAbilitySelfDefeat) {
			defeated = updatedStats.playerStats;
			break;
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
			isStunned: updatedStats.isPlayerStunned,
			isAsleep: updatedStats.isPlayerAsleep,
			isEvadeHit: updatedStats.isOpponentEvadeHit,
		});
		const desc = await simulateBattleDescription({
			playerStats,
			enemyStats,
			description: battleDescription,
			totalDamage,
		});
		simulation.rounds[round].descriptions.push({
			description: desc,
			delay: 1000
		});
		isPlayerFirst = !isPlayerFirst;
		if (updatedStats.damageDiff <= 0) {
			defeated = getDefeated({
				updatedStats,
				playerStats,
				enemyStats,
				baseEnemyStats,
				basePlayerStats,
				round,
				isPlayerFirst,
				simulation
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
				isPlayerFirst,
				simulation
			});
			break;
		}
	}
	return {
		defeated,
		totalDamage,
		playerStats,
		enemyStats,
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
	isStunned,
	isAsleep,
	isEvadeHit,
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
  isEvadeHit?: boolean;
  isStunned?: boolean;
  isAsleep?: boolean;
}) {
	let desc = `${turn === 0 ? `${description}\n` : `**[ROUND ${round}**]\n`}${
		emoji.fast
	}`;

	const playerDesc = `**${
		isPlayerFirst ? playerStats.name : enemyStats.name
	}**`;

	const enemyDesc = `**${isPlayerFirst ? enemyStats.name : playerStats.name}**`;

	if (isStunned) {
		desc = `${desc} ${playerDesc} is **Stunned** ${emoji.stun}! It cannot attack!`;
	} else if (isAsleep) {
		desc = `${desc} ${playerDesc} is **Drowsy** ${emoji.sleep}. It cannot attack!`;
	} else if (isEvadeHit) {
		desc = `${desc} ${enemyDesc} has **Evaded** ${emoji.evasion}, taking no damage!`;
	} else {
		desc = `${desc} ${playerDesc} deals __${damageDealt}__ damage ${
			isCriticalHit
				? "**CRITICAL HIT**"
				: opponentStats.totalStats.effective < 1
					? "it was **Super Effective!**"
					: opponentStats.totalStats.effective > 1
						? "but it was not very effective..."
						: ""
		}\n${
			damageDiff !== 0 && turn === 0
				? `${enemyDesc} strikes back fiercely! ${emoji.angry}`
				: ""
		}`;
	}

	return desc;
}

function getDefeated({
	updatedStats,
	playerStats,
	enemyStats,
}: Omit<BattleProcessProps, "opponentStats"> & {
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
	if (
		compareHpPercent(
			updatedStats.opponentStats.totalStats,
			compareWith.totalStats
		)
	) {
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
