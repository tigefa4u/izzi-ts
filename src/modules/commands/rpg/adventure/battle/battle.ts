import {
	BattleProcessProps,
	BattleStats,
	BattleUpdatedStats,
	PrepareBattleDescriptionProps,
	SimulateBattleProps,
	Simulation,
	SimulationRound,
} from "@customTypes/adventure";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { delay, generateUUID } from "helpers";
import { prepareBattleDesc } from "helpers/adventure";
import {
	compare,
	getPercentOfTwoNumbers,
	processEnergyBar,
	processHpBar,
	recreateBattleEmbed,
	relativeDiff,
	simulateBattleDescription,
} from "helpers/battle";
import {
	BATTLE_FORFEIT_RETRIES,
	BATTLE_ROUNDS_COUNT,
	CONSOLE_BUTTONS,
	ELEMENTAL_ADVANTAGES,
	RAGE_MODE_ROUND,
} from "helpers/constants/constants";
import loggers from "loggers";
import { clone } from "utility";
import { BattleProcess } from "./battleProcess";
import { prepareCriticalHitChance, prepareEvadeHitChance } from "./chances";
import * as battlesPerChannel from "./battlesPerChannelState";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { createBattleCanvas } from "helpers/canvas";
import { Message } from "discord.js";
import { customButtonInteraction } from "utility/ButtonInteractions";

export const simulateBattle = async ({
	context,
	playerStats,
	enemyStats,
	title = "__TEAM BATTLE__",
	isRaid,
	options,
	multiplier,
	canEnterRageMode = false
}: SimulateBattleProps & { isRaid?: boolean; canEnterRageMode?: boolean; }) => {
	if (!context.channel?.id) return;
	let battlesInChannel = battlesPerChannel.validateBattlesInChannel(
		context.channel.id
	);
	// Create an object that stores all data needed for simulation
	const simulation = { title } as Simulation;
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
				descriptions: [
					{
						description,
						delay: 0,
						id: generateUUID(4),
					},
				],
				canSimulateRound: true,
				round: 0,
			},
		};

		let totalDamage = 0;
		let roundStats: BattleStats | undefined;
		for (let round = 1; round <= BATTLE_ROUNDS_COUNT; round++) {
			/**
       * GAIN SOME INT EVERY 5th ROUND TO BALANCE COMPS WITH NO INT BUFFS
       * TO GIVE A FAIR CHANCE
       */
			// 	if (round % 5 === 0) {
			// 		const playerIntBuff = basePlayerStats.totalStats.intelligence * 0.3;
			// 		const enemyIntBuff = baseEnemyStats.totalStats.intelligence * 0.3;
			// 		playerStats.totalStats.intelligence =
			//   playerStats.totalStats.intelligence + playerIntBuff;
			// 		enemyStats.totalStats.intelligence =
			//   enemyStats.totalStats.intelligence + enemyIntBuff;

			// 		const diff = getPercentOfTwoNumbers(
			// 			playerStats.totalStats.intelligence,
			// 			basePlayerStats.totalStats.intelligence
			// 		);
			// 		const oppDiff = getPercentOfTwoNumbers(
			// 			enemyStats.totalStats.intelligence,
			// 			baseEnemyStats.totalStats.intelligence
			// 		);
			// 		const playerEnergy = processEnergyBar({
			// 			dpr: diff,
			// 			energy: playerStats.totalStats.energy,
			// 		});
			// 		const oppEnergy = processEnergyBar({
			// 			dpr: oppDiff,
			// 			energy: playerStats.totalStats.energy,
			// 		});
			// 		playerStats.totalStats.dpr = playerEnergy.dpr;
			// 		playerStats.totalStats.energy = playerEnergy.energy;
			// 		enemyStats.totalStats.dpr = oppEnergy.dpr;
			// 		enemyStats.totalStats.energy = oppEnergy.energy;
			// 	}

			const isPlayerFirst = compare(
				playerStats.totalStats.dexterity,
				enemyStats.totalStats.dexterity
			);
			const statusDescription = `${emoji.hasmorespeed} **${
				isPlayerFirst ? playerStats.name : enemyStats.name
			}** has more __Speed__. It strikes first!`;
			const updatedDescription = `${emoji.up} **[ROUND ${round}]**\n${statusDescription}`;

			const desc = await simulateBattleDescription({
				playerStats,
				enemyStats,
				description: updatedDescription,
				totalDamage,
			});
			simulation.rounds[round] = {
				descriptions: [
					{
						description: desc,
						delay: 1000,
						rawDescription: updatedDescription,
						id: generateUUID(4),
					},
				],
				canSimulateRound: true,
				round,
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
				simulation,
				multiplier,
				canEnterRageMode
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
		if (!options?.hideVisualBattle) {
			roundStats = await visualizeSimulation({
				simulation,
				context,
				attachments: attachmentCards,
				roundStats: clone(roundStats),
				retries: 0,
				authorId: playerStats.id,
				isRaid,
			});
		}
		battlesInChannel = battlesPerChannel.get(context.channel.id);
		battlesPerChannel.set(context.channel.id, (battlesInChannel || 1) - 1);
		if (roundStats) {
			if (roundStats.id === playerStats.id) {
				roundStats.isVictory = false;
			} else {
				roundStats.isVictory = true;
			}
			roundStats.enemyStats = enemyStats;
			roundStats.totalDamage = totalDamage;
		}
		if (roundStats?.isForfeit === true) {
			context.channel?.sendMessage("You have forfeit the battle");
			simulation.isForfeit = true;
			return roundStats;
		}
		if (roundStats) {
			roundStats.soulGainText =
        playerStats.soulGainText || enemyStats.soulGainText;
			roundStats.simulation = simulation;
			roundStats.attachments = attachmentCards;
		}
		return roundStats;
	} catch (err) {
		simulation.hasCrashed = true;
		battlesPerChannel.set(context.channel.id, 0);
		loggers.error(
			"modules.commands.rpg.adventure.battle.simulateBattle: ERROR",
			err
		);
		return;
	}
};

async function sendBattleDescription({
	rounds,
	round,
	message,
	title,
	sliceX,
	sliceY,
}: {
  rounds: V["simulation"]["rounds"];
  round: string;
  message: Message;
  title: string;
  sliceX: number;
  sliceY: number;
}) {
	let roundDescriptions = rounds[round].descriptions
		.slice(sliceX, sliceY + 1)
		.map((d) => {
			// if (d.showUpdatedDescription) {
			// 	return d.description;
			// }
			return d.rawDescription;
		})
		.join("\n");

	roundDescriptions = roundDescriptions.replace(
		emoji.up,
		`**${emoji.up} [Round ${round}]**\n`
	);

	// For rate limits
	const newEmbed = recreateBattleEmbed(title || "", roundDescriptions);
	try {
		await delay(1200);
		await message.editMessage(newEmbed, { reattachOnEdit: true });
		return rounds[round].descriptions.slice(
			sliceX,
			rounds[round].descriptions.length
		);
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.adventure.battle.visualizeSimulation: ERROR",
			err
		);
		return;
	}
}

const prepareDX = (
	prevIndex = 0,
	roundDescriptions: Simulation["rounds"][""]["descriptions"]
) => {
	const index = roundDescriptions
		.slice(prevIndex, roundDescriptions.length)
		.findIndex((d) => d.showUpdatedDescription === true);

	if (index > 0) {
		return index;
	} else {
		return Math.ceil(roundDescriptions.length / 2);
	}
};

type R = {
  rounds: Simulation["rounds"];
  round: string;
  message: Message;
  title: string;
  dx: number;
  dy: number;
};
const processRoundDesc = async ({
	round,
	rounds,
	message,
	title,
	dx,
	dy,
}: R): Promise<boolean> => {
	const descriptionsClone = rounds[round].descriptions;
	const battleRound = await sendBattleDescription({
		rounds,
		round,
		message,
		title: title,
		sliceX: dx,
		sliceY: dy,
	});
	if (battleRound && battleRound.length > 0) {
		return processRoundDesc({
			round,
			rounds,
			title,
			dx: dy,
			dy: prepareDX(dy, descriptionsClone),
			message,
		});
	}
	if (!battleRound) {
		return false;
	}
	return true;
};

type V = {
  simulation: Simulation;
  context: SimulateBattleProps["context"];
  attachments: (CollectionCardInfoProps | undefined)[];
  retries: number;
  authorId: string;
  roundStats?: BattleStats;
  isRaid?: boolean;
};
async function visualizeSimulation({
	simulation,
	context,
	attachments,
	roundStats,
	retries,
	authorId,
	isRaid,
}: V): Promise<BattleStats | undefined> {
	const canvas = await createBattleCanvas(attachments, {
		isRaid,
		isSingleRow: false,
	});
	if (!canvas) {
		throw new Error("Failed to create battle canvas");
	}
	const attachment = createAttachment(canvas.createJPEGStream(), "battle.jpg");

	const rounds = simulation.rounds;
	const roundKeys = Object.keys(rounds);
	const initialKey = roundKeys.shift();
	if (!initialKey) {
		throw new Error("No rounds found in simulation");
	}

	rounds[initialKey].descriptions[0].description = rounds[
		initialKey
	].descriptions[0].description.replace(emoji.up, "");

	const embed = createEmbed()
		.setTitle(simulation.title)
		.setDescription(rounds[initialKey].descriptions[0].description)
		.attachFiles([ attachment ])
		.setImage("attachment://battle.jpg");

	let canEndBattle = false;
	const buttons = customButtonInteraction(
		context.channel,
		[
			{
				style: "PRIMARY",
				label: CONSOLE_BUTTONS.FINISH_BATTLE.label,
				params: { id: CONSOLE_BUTTONS.FINISH_BATTLE.id },
			},
			{
				style: "DANGER",
				label: CONSOLE_BUTTONS.FORFEIT.label,
				params: {
					isForfeit: true,
					id: CONSOLE_BUTTONS.FORFEIT.id,
				},
			},
		],
		authorId,
		({ isForfeit, id }) => {
			canEndBattle = true;
			if (isForfeit) {
				if (roundStats) roundStats.isForfeit = true;
			}
		},
		() => {
			return;
		}
	);

	if (!buttons) return;
	embed.setButtons(buttons).setHideConsoleButtons(true);

	const message = await context.channel?.sendMessage(embed);
	if (!message) {
		context.channel?.sendMessage("ERROR with your battle");
		throw new Error("Message Object not found to edit battle");
	}

	let roundFFOn: number | undefined;
	for (const round of roundKeys) {
		if (canEndBattle && !roundStats?.isForfeit) {
			await delay(1200);
			const lastKey = roundKeys[roundKeys.length - 1];
			const lastDesc =
        rounds[lastKey].descriptions[rounds[lastKey].descriptions.length - 1]
        	.description;
			const newEmbed = recreateBattleEmbed(embed.title || "", lastDesc);
			await message.editMessage(newEmbed, { reattachOnEdit: true });
		}
		if (canEndBattle) break;

		// Need to fix this for optimization
		// const battleRound = await processRoundDesc({
		// 	round,
		// 	rounds,
		// 	message,
		// 	title: embed.title || "",
		// 	dx: 0,
		// 	dy: prepareDX(0, rounds[round].descriptions)
		// });
		// if (!battleRound) {
		// 	if (roundStats) roundStats.isForfeit = true;
		// 	canEndBattle = true;
		// 	roundFFOn = +round;
		// }

		for (const data of rounds[round].descriptions) {
			if (roundStats?.isForfeit) break;
			const newEmbed = recreateBattleEmbed(embed.title || "", data.description);
			try {
				await delay(1200);
				await message.editMessage(newEmbed, { reattachOnEdit: true });
			} catch (err) {
				loggers.error(
					"modules.commands.rpg.adventure.battle.visualizeSimulation: ERROR",
					err
				);
				if (roundStats) roundStats.isForfeit = true;
				canEndBattle = true;
				roundFFOn = +round;
				break;
			}
		}
	}
	if (roundFFOn && retries < BATTLE_FORFEIT_RETRIES) {
		context.channel?.sendMessage("Your battle has crashed, retrying...");
		let start = +roundFFOn - 1;
		if (start < 0) start = 0;
		const clonedKeys = [ "0", ...roundKeys ];
		const keys = clonedKeys.slice(start);
		const newRounds = keys.reduce((acc, r) => {
			acc[r] = rounds[r];
			return acc;
		}, {} as { [key: string]: SimulationRound });
		retries = retries + 1;
		simulation.rounds = newRounds;
		delete roundStats?.isForfeit;
		return visualizeSimulation({
			context,
			simulation,
			retries,
			attachments,
			roundStats,
			authorId,
		});
	}

	return roundStats;
}

function boostRaidBoss({
	enemyStats,
	round,
	baseEnemyStats,
	turn,
}: Pick<PrepareBattleDescriptionProps, "enemyStats" | "baseEnemyStats"> & {
  round: number;
  turn: number;
}) {
	if (!enemyStats.totalStats.critical) enemyStats.totalStats.critical = 1;
	enemyStats.totalStats.critical = enemyStats.totalStats.critical + 0.5;
	if (!enemyStats.totalStats.criticalDamage)
		enemyStats.totalStats.criticalDamage = 1;
	enemyStats.totalStats.criticalDamage =
    enemyStats.totalStats.criticalDamage + 0.3;

	// boost raid boss ATK by 15%
	enemyStats.totalStats.vitality =
		Math.floor(enemyStats.totalStats.vitality + (enemyStats.totalStats.vitality * 0.15));
	enemyStats.totalStats.defense = Math.floor(enemyStats.totalStats.defense + (enemyStats.totalStats.defense * .15));

	if (baseEnemyStats && enemyStats.isRageMode && enemyStats.enterRageMode) {
		enemyStats.totalStats.intelligence = baseEnemyStats.totalStats.intelligence;
		enemyStats.totalStats.strength = enemyStats.totalStats.originalHp || 0;
		const diffHp = relativeDiff(
			enemyStats.totalStats.strength,
			enemyStats.totalStats.originalHp || 0
		);
		const hpBar = processHpBar(enemyStats.totalStats, diffHp);
		enemyStats.totalStats.strength = hpBar.strength;
		enemyStats.totalStats.health = hpBar.health;

		const diff = getPercentOfTwoNumbers(
			enemyStats.totalStats.intelligence,
			baseEnemyStats.totalStats.intelligence
		);
		const energy = processEnergyBar({
			dpr: diff,
			energy: enemyStats.totalStats.energy,
		});
		enemyStats.totalStats.energy = energy.energy;
		enemyStats.totalStats.dpr = energy.dpr;
	}
	return {
		enemyStats,
		desc:
      `**[ROUND ${round}]**\n**${enemyStats.name}** has entered **Rage Mode** ${emoji.angry}, ` +
      "its **Critical Hit** chance and **Critical Hit Damage** will increase over time by **__30%__**. " +
      "Its **ATK** and **DEF** will also increase by __15%__ and has regenerated " +
	  `its **ARMOR** and **HP**! ${emoji.criticalDamage}`,
	};
}

const toggleRageMode = ({
	isRaid,
	defeated,
	enemyStats,
	canEnterRageMode,
}: {
	isRaid?: boolean;
	defeated: BattleStats | undefined;
	enemyStats: BattleStats;
	canEnterRageMode?: boolean;
}) => {
	if (isRaid && defeated?.isBot && !defeated?.isRageMode && canEnterRageMode) {
		enemyStats.enterRageMode = true;
		enemyStats.isRageMode = true;
		defeated = undefined;
	}
	return {
		enemyStats,
		defeated 
	};
};

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
	simulation,
	multiplier,
	canEnterRageMode
}: PrepareBattleDescriptionProps &
  Omit<BattleProcessProps, "opponentStats"> & {
    isRaid?: boolean;
    multiplier?: number;
	canEnterRageMode?: boolean;
  }) {
	let defeated;
	for (let i = 0; i < 2; i++) {
		if (enemyStats.isRageMode) {
			const boost = boostRaidBoss({
				enemyStats,
				round,
				baseEnemyStats,
				turn: i,
			});
			enemyStats = boost.enemyStats;
			if (enemyStats.enterRageMode) {
				const desc = await simulateBattleDescription({
					playerStats,
					enemyStats,
					description: boost.desc,
					totalDamage,
				});
				simulation.rounds[round].descriptions.push({
					description: desc,
					delay: 1000,
					rawDescription: boost.desc,
					id: generateUUID(4),
				});
				enemyStats.enterRageMode = false;
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
			baseEnemyStats: isPlayerFirst ? baseEnemyStats : basePlayerStats,
			basePlayerStats: isPlayerFirst ? basePlayerStats : baseEnemyStats,
			isPlayerFirst,
			opponentStats: isPlayerFirst ? enemyStats : playerStats,
			playerStats: isPlayerFirst ? playerStats : enemyStats,
			round,
			simulation,
			isRaid,
			multiplier,
		});
		// if (updatedStats.forfeit) {
		// 	// Should never execute
		// 	defeated = playerStats;
		// 	defeated.isForfeit = true;
		// 	simulation.rounds[round].canSimulateRound = false;
		// 	simulation.isForfeit = true;
		// 	break;
		// }
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
			// totalDamage += Math.floor(damageDealt);

			// play with this and see if its too easy to deal damage
			if (!updatedStats.isDamageAbsorbed) {
				totalDamage += Math.floor(damageDealt);
			}
			totalDamage += abilityDamage;
		}
		if (updatedStats.isAbilityDefeat) {
			const computed = toggleRageMode({
				isRaid,
				defeated: updatedStats.opponentStats,
				enemyStats,
				canEnterRageMode,
			});
			defeated = computed.defeated;
			enemyStats = computed.enemyStats;
			if (defeated === undefined) continue;
			break;
		} else if (updatedStats.isAbilitySelfDefeat) {
			const computed = toggleRageMode({
				isRaid,
				defeated: updatedStats.playerStats,
				enemyStats,
				canEnterRageMode,
			});
			defeated = computed.defeated;
			enemyStats = computed.enemyStats;
			if (defeated === undefined) continue;
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
			isParanoid: updatedStats.isPlayerParanoid,
			isDamageAbsorbed: updatedStats.isDamageAbsorbed,
			hasZombieAura: updatedStats.hasZombieAura,
		});
		const desc = await simulateBattleDescription({
			playerStats,
			enemyStats,
			description: battleDescription,
			totalDamage,
		});
		simulation.rounds[round].descriptions.push({
			description: desc,
			delay: 1000,
			rawDescription: battleDescription,
			showUpdatedDescription: true,
			id: generateUUID(4),
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
				simulation,
			});
			/**
			 * rework - the boss enters rage mode only after
			 * its first hp is depleted
			 */
			const computed = toggleRageMode({
				isRaid,
				defeated,
				enemyStats,
				canEnterRageMode,
			});
			defeated = computed.defeated;
			enemyStats = computed.enemyStats;
			if (defeated === undefined) continue;
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
				simulation,
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

export function getElementalEffectiveStatus(num: number, isBattle?: boolean) {
	switch (num) {
		case ELEMENTAL_ADVANTAGES.DEFAULT.p2:
			return "**Slightly Effective**" + (isBattle ? " :star:" : "");
		case ELEMENTAL_ADVANTAGES.EFFECTIVE.p2:
			return "**Effective**" + (isBattle ? " :star::star:" : "");
		case ELEMENTAL_ADVANTAGES.SUPER_EFFECTIVE.p2:
			return "**Super Effective!**" + (isBattle ? " :star::star::star:" : "");
		default:
			return "";
	}
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
	isParanoid,
	isDamageAbsorbed,
	hasZombieAura
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
  isParanoid?: boolean;
  isDamageAbsorbed?: boolean;
  hasZombieAura?: boolean;
}) {
	let desc = `${
		turn === 0 ? `${description}\n` : `${emoji.up} **[ROUND ${round}**]\n`
	}${emoji.fast}`;
	// let desc = description;

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
	} else if (isParanoid) {
		desc = `${desc} ${playerDesc} is **Paranoid** ${emoji.paranoid}! It cannot attack!`;
	} else {
		desc = `${desc} ${playerDesc} deals __${Math.floor(damageDealt)}__ damage${
			isDamageAbsorbed ? ` But it was absorbed by ${enemyDesc}'s ARMOR ${emoji.armor}` : ""
		} ${
			isCriticalHit
				? "**CRITICAL HIT**"
				: opponentStats.totalStats.effective < 1
					? "it was " +
          getElementalEffectiveStatus(opponentStats.totalStats.effective)
					: opponentStats.totalStats.effective > 1
						? "but it was not very effective..."
						: ""
		}${hasZombieAura ? `${opponentStats.name} has survived due to **Zombie Aura**` : ""}\n${
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
