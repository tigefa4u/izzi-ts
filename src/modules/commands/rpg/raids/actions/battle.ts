import { RaidActionProps, RaidProps } from "@customTypes/raids";
import { getRPGUser } from "api/controllers/UsersController";
import { CONSOLE_BUTTONS, ENERGY_PER_ATTACK, HIDE_VISUAL_BATTLE_ARG } from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { validateCurrentRaid } from "./validateRaid";
import * as battleInChannel from "../../adventure/battle/battlesPerChannelState";
import { validateAndPrepareTeam } from "helpers/teams";
import { simulateBattle } from "../../adventure/battle/battle";
import { clone } from "utility";
import { BattleStats, Simulation } from "@customTypes/adventure";
import { AuthorProps, ChannelProp } from "@customTypes";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import {
	processHpBar,
	relativeDiff,
	validateFiveMinuteTimer,
} from "helpers/battle";
import { addTeamEffectiveness, prepareHPBar } from "helpers/adventure";
import {
	getRaid,
	updateLobby,
	updateRaid,
} from "api/controllers/RaidsController";
import { Canvas } from "canvas";
import { createSingleCanvas, createBattleCanvas } from "helpers/canvas";
import { createAttachment } from "commons/attachments";
import { processRaidLoot } from "../processRaidLoot";
import { prepareRaidBossBase } from "helpers/raid";
import { SingleCanvasReturnType } from "@customTypes/canvas";
import { numericWithComma } from "helpers";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { CustomButtonInteractionParams } from "@customTypes/button";
import Cache from "cache";
import { eventActions } from "../events";
import { raidActions } from "..";
import { BaseProps } from "@customTypes/command";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { viewBattleLogs } from "../../adventure/battle/viewBattleLogs";

export const battleRaidBoss = async ({
	context,
	options,
	client,
	isEvent,
	args,
}: RaidActionProps) => {
	try {
		const author = options.author;
		let inBattle = await getCooldown(
			author.id,
			`${isEvent ? "event" : "raid"}-battle`
		);
		if (inBattle) {
			await validateFiveMinuteTimer({
				timestamp: inBattle.timestamp,
				key: `cooldown::${isEvent ? "event" : "raid"}-battle-${author.id}`,
			});
			context.channel?.sendMessage("Your battle is still in progress");
			return;
		}
		const battles = battleInChannel.validateBattlesInChannel(
			context.channel?.id || ""
		);
		if (battles === undefined) return;
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (!user.selected_team_id) {
			context.channel?.sendMessage("Please select a valid Team!");
			return;
		}
		const currentRaid = await validateCurrentRaid(
			user.id,
			author,
			client,
			context.channel
		);
		if (!currentRaid) return;
		if (!currentRaid.is_start) {
			context.channel?.sendMessage(
				`The ${isEvent ? "Event" : "Raid"} Challenge has not started yet!`
			);
			return;
		}
		const attacker = currentRaid.lobby[user.id];
		if (!attacker) {
			context.channel?.sendMessage("Unable to attack, please report");
			throw new Error("Unable to find attacker in lobby: user ID: " + user.id);
		}
		if (attacker.energy < ENERGY_PER_ATTACK) {
			context.channel?.sendMessage(
				`Summoner **${attacker.username}**, ` +
		  `You do not have sufficient energy to attack! **__[${attacker.energy} / ${ENERGY_PER_ATTACK}]__**`
			);
			return;
		}

		const playerStats = await validateAndPrepareTeam(
			user.id,
			user.user_tag,
			user.selected_team_id,
			context.channel
		);
		if (!playerStats) return;

		const enemyStats = prepareRaidBossBase(currentRaid, isEvent);
		enemyStats.totalStats.strength = currentRaid.stats.remaining_strength;
		enemyStats.totalStats.originalHp = currentRaid.stats.remaining_strength;
		const {
			playerStats: effectiveStats,
			opponentStats: opponentEffectiveStats,
		} = addTeamEffectiveness({
			cards: playerStats.stats.cards,
			enemyCards: enemyStats.cards,
			playerStats: playerStats.stats.totalStats,
			opponentStats: enemyStats.totalStats,
		});
		playerStats.stats.totalStats = effectiveStats;
		enemyStats.totalStats = opponentEffectiveStats;
		enemyStats.isBot = true;

		inBattle = await getCooldown(
			author.id,
			`${isEvent ? "event" : "raid"}-battle`
		);
		if (inBattle) {
			context.channel?.sendMessage("Your battle is still in progress");
			return;
		}
		let multiplier = 1;
		const paramArgs = (args[0] || "").toLowerCase();
		if (paramArgs === "all") {
			args.shift();
			multiplier = Math.floor(attacker.energy / ENERGY_PER_ATTACK);
		}

		const hideBt = (args.shift() || "").toLowerCase();
		const damageCap = Math.floor(
			currentRaid.stats.original_strength * ((multiplier * 10) / 100)
		);
		setCooldown(author.id, `${isEvent ? "event" : "raid"}-battle`, 60 * 5);
		const result = await simulateBattle({
			context,
			playerStats: playerStats.stats,
			enemyStats,
			title: `${isEvent ? "Event" : "Raid"} Challenge Battle`,
			isRaid: true,
			options: { hideVisualBattle: hideBt === HIDE_VISUAL_BATTLE_ARG ? true : false, },
			multiplier
		});
		clearCooldown(author.id, `${isEvent ? "event" : "raid"}-battle`);
		if (!result) {
			context.channel?.sendMessage(
				"Unable to process battle, please try again later"
			);
			return;
		}
		const refetchRaid = await getRaid({ id: currentRaid.id });
		if (!refetchRaid) {
			context.channel?.sendMessage(
				"Your Raid has either fled or has ended. " +
          "If you think your raid did not flee, please report in the Bugs channel. Lobby Code: " +
          currentRaid.id
			);
			loggers.error(
				`Unable to validate raid user: ${author.id} with id: ${
					currentRaid.id
				}, Raid -> ${JSON.stringify(currentRaid)}`,
				{}
			);
			return;
		}
		if (refetchRaid.lobby[user.id].energy < ENERGY_PER_ATTACK) {
			context.channel?.sendMessage(
				`Summoner **${author.username}**, You do not have sufficient energy to proceed with this battle.`
			);
			return;
		}
		const updateObj = clone(refetchRaid);
		if (result.isForfeit) {
			await consumeEnergy(updateObj.id, user.id, multiplier, 0);
		} else {
			if (result.totalDamage === undefined || isNaN(result.totalDamage)) {
				context.channel?.sendMessage("Unable to calculate total damage");
				return;
			}
			result.totalDamage = Math.floor(
				Math.ceil(result.totalDamage * 1.35) * multiplier
			);
			if (result.totalDamage > damageCap) result.totalDamage = damageCap;
			const updatedLobby = await consumeEnergy(
				updateObj.id,
				user.id,
				multiplier,
				result.totalDamage
			);
			if (updatedLobby) {
				updateObj.lobby = updatedLobby;
			}

			updateObj.stats.remaining_strength =
        updateObj.stats.remaining_strength - result.totalDamage;
			if (updateObj.stats.remaining_strength < 0)
				updateObj.stats.remaining_strength = 0;
		}
		await updateRaid({ id: updateObj.id }, { stats: updateObj.stats });

		await Promise.all([
			processRaidLoot({
				client,
				author,
				raid: updateObj,
				isEvent,
			}),
			processRaidResult({
				result: result as BattleStats,
				updateObj,
				author,
				isEvent,
				channel: context.channel,
			}),
		]);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.actions.battleRaidBoss: ERROR",
			err
		);
		return;
	}
};

const handleButtonClick = async ({
	id, channel, client, user_tag, message, simulation, attachments
}: CustomButtonInteractionParams & {
	simulation?: Simulation;
	attachments?: (CollectionCardInfoProps | undefined)[];
}) => {
	const [ author, disableRaids ] = await Promise.all([
		client.users.fetch(user_tag),
		Cache.get("disable-raids")
	]);
	let isEvent = false;
	if (disableRaids) isEvent = true;

	const options = {
		context: { channel } as BaseProps["context"],
		args: [ "bt" ],
		options: { author },
		client
	};
	if (id === CONSOLE_BUTTONS.RAID_BATTLE.id) {
		if (isEvent) {
			eventActions(options);
		} else {
			raidActions(options);
		}
	}
	if (id === CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id && simulation && attachments) {
		viewBattleLogs({
			simulation,
			authorId: author.id,
			attachments,
			channel
		});
	}
	return;
};

type R = {
  result: BattleStats;
  updateObj: RaidProps;
  author: AuthorProps;
  isEvent: boolean;
  channel: ChannelProp;
};
async function processRaidResult({
	result,
	updateObj,
	author,
	isEvent,
	channel,
}: R) {
	const damageDiff = relativeDiff(
		updateObj.stats.remaining_strength,
		updateObj.stats.original_strength,
		8
	);
	const overAllStats = {
		health: prepareHPBar(8),
		strength: updateObj.stats.remaining_strength,
	};
	const fakeHp = processHpBar(overAllStats, damageDiff).health;
	let bossCanvas: SingleCanvasReturnType | Canvas | undefined;
	if (isEvent) {
		bossCanvas = await createSingleCanvas(updateObj.raid_boss[0], false);
	} else {
		bossCanvas = await createBattleCanvas(updateObj.raid_boss, {
			isSingleRow: true,
			version: "small",
		});
	}
	if (!bossCanvas) {
		channel?.sendMessage(
			"Your battle has been processed, but we were not able to show the result."
		);
		return;
	}

	const attachment = createAttachment(
		bossCanvas.createJPEGStream(),
		"boss.jpg"
	);
	const embed = createEmbed(author)
		.setTitle(`${emoji.welldone} Total Damage Dealt`)
		.setDescription(
			`**Summoner ${
				author.username
			}, You have dealt:**\n\n**__${numericWithComma(
				result.totalDamage || 0
			)}__** Damage to ${
				isEvent ? "Event" : "Raid"
			} Boss${result.soulGainText ? `\n${result.soulGainText}` : ""}\n\n**${numericWithComma(
				updateObj.stats.remaining_strength
			)} / ${numericWithComma(updateObj.stats.original_strength)} ${
				emoji.hp
			}**\n${fakeHp.map((i) => i).join("")}`
		)
		.setThumbnail("attachment://boss.jpg")
		.attachFiles([ attachment ]);

	const buttons = customButtonInteraction(
		channel,
		[
			{
				label: CONSOLE_BUTTONS.RAID_BATTLE.label,
				params: { id: CONSOLE_BUTTONS.RAID_BATTLE.id }
			},
			{
				label: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.label,
				params: {
					id: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id,
					simulation: result.simulation,
					attachments: result.attachments 
				}
			}
		],
		author.id,
		handleButtonClick,
		() => {
			return;
		},
		true,
		10
	);

	if (buttons) {
		embed.setButtons(buttons);
	}
	channel?.sendMessage(embed);
	return;
}

async function consumeEnergy(
	raidId: number,
	user_id: number,
	multiplier = 1,
	totalDamage = 0
) {
	const raid = await getRaid({ id: raidId });
	if (!raid) {
		return;
	}
	const lobby = raid.lobby;
	const member = lobby[user_id];
	if (!member) {
		delete lobby[user_id];
		return lobby;
	}
	member.energy = member.energy - Math.floor(multiplier * ENERGY_PER_ATTACK);
	if (member.energy < 0) member.energy = 0;
	member.total_attack = member.total_attack + multiplier;
	member.total_damage = (member.total_damage || 0) + totalDamage;
	member.timestamp = Date.now();
	lobby[member.user_id] = member;
	await updateLobby({
		raid_id: raid.id,
		user_id,
		data: member,
	});

	return lobby;
}
