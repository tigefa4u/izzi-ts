import { RaidActionProps, RaidLobbyProps, RaidProps } from "@customTypes/raids";
import { getRPGUser } from "api/controllers/UsersController";
import { ENERGY_PER_ATTACK } from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { validateCurrentRaid } from "./validateRaid";
import * as battleInChannel from "../../adventure/battle/battlesPerChannelState";
import {
	prepareSkewedCollectionsForBattle,
	validateAndPrepareTeam,
} from "helpers/teams";
import { simulateBattle } from "../../adventure/battle/battle";
import { clone } from "utility";
import { BattleStats } from "@customTypes/adventure";
import { AuthorProps, ChannelProp } from "@customTypes";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { processHpBar, relativeDiff } from "helpers/battle";
import { addTeamEffectiveness, createBattleCanvas, prepareHPBar } from "helpers/adventure";
import { updateRaid } from "api/controllers/RaidsController";
import { Canvas } from "canvas";
import { createSingleCanvas } from "helpers/canvas";
import { createAttachment } from "commons/attachments";
import { processRaidLoot } from "../processRaidLoot";
import { prepareRaidBossBase } from "helpers/raid";

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
		enemyStats.totalStats.originalHp = currentRaid.stats.original_strength;

		const { playerStats: effectiveStats, opponentStats: opponentEffectiveStats } = await addTeamEffectiveness({
			cards: playerStats.stats.cards,
			enemyCards: enemyStats.cards,
			playerStats: playerStats.stats.totalStats,
			opponentStats: enemyStats.totalStats 
		});

		playerStats.stats.totalStats = effectiveStats;
		enemyStats.totalStats = opponentEffectiveStats;

		inBattle = await getCooldown(
			author.id,
			`${isEvent ? "event" : "raid"}-battle`
		);
		if (inBattle) {
			context.channel?.sendMessage("Your battle is still in progress");
			return;
		}
		let multiplier = 1;
		if (args.shift() === "all")
			multiplier = Math.floor(attacker.energy / ENERGY_PER_ATTACK);
		const damageCap = Math.floor(
			currentRaid.stats.original_strength * ((multiplier * 12.5) / 100)
		);
		setCooldown(author.id, `${isEvent ? "event" : "raid" }-battle`, 60 * 5);
		const result = await simulateBattle({
			context,
			playerStats: playerStats.stats,
			enemyStats,
			title: `${isEvent ? "Event" : "Raid"} Challenge Battle`,
		});
		clearCooldown(author.id, `${isEvent ? "event" : "raid"}-battle`);
		if (!result) {
			context.channel?.sendMessage(
				"Unable to process battle, please try again later"
			);
			return;
		}

		const updateObj = clone(currentRaid);
		if (result.isForfeit) {
			context.channel?.sendMessage("You have forfeit the battle");
			updateObj.lobby = consumeEnergy(
				currentRaid.lobby,
				user.id,
				multiplier,
				0
			);
		} else {
			if (result.totalDamage === undefined || isNaN(result.totalDamage)) {
				context.channel?.sendMessage("Unable to calculate total damage");
				return;
			}
			result.totalDamage = Math.floor(Math.ceil(result.totalDamage * 1.35) * multiplier);
			if (result.totalDamage > damageCap) result.totalDamage = damageCap;
			updateObj.lobby = consumeEnergy(
				currentRaid.lobby,
				user.id,
				multiplier,
				result.totalDamage
			);

			updateObj.stats.remaining_strength =
		updateObj.stats.remaining_strength - result.totalDamage;
			if (updateObj.stats.remaining_strength < 0)
				updateObj.stats.remaining_strength = 0;
		}
		await Promise.all([ updateRaid({ id: updateObj.id }, {
			lobby: updateObj.lobby,
			stats: updateObj.stats
		}),
		processRaidLoot({
			client,
			author,
			raid: updateObj,
			isEvent
		}) ]);

		const battleStatus = result as BattleStats;
		processRaidResult({
			result: battleStatus,
			updateObj,
			author,
			isEvent,
			channel: context.channel
		});
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.actions.battleRaidBoss(): something went wrong",
			err
		);
		return;
	}
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
	channel
}: R) {
	const damageDiff = relativeDiff(
		updateObj.stats.remaining_strength,
		updateObj.stats.original_strength
	);
	const overAllStats = {
		health: prepareHPBar(8),
		strength: updateObj.stats.remaining_strength,
	};
	const fakeHp = processHpBar(overAllStats, damageDiff).health;
	let bossCanvas: Canvas | undefined;
	if (isEvent) {
		bossCanvas = await createSingleCanvas(updateObj.raid_boss[0], false);
	} else {
		bossCanvas = await createBattleCanvas(updateObj.raid_boss, { isSingleRow: true });
	}
	if (!bossCanvas) {
	    channel?.sendMessage("Your battle has been processed, but we were not able to show the result.");
		return;
	}

	const attachment = createAttachment(bossCanvas.createJPEGStream(), "boss.jpg");
	const embed = createEmbed(author)
		.setTitle(`${emoji.welldone} Total Damage Dealt`)
		.setDescription(
			`**Summoner ${author.username}, You have dealt:**\n\n**__${
				result.totalDamage
			}__** Damage to ${isEvent ? "Event" : "Raid"} Boss\n\n**${
				updateObj.stats.remaining_strength
			} / ${updateObj.stats.original_strength} ${emoji.hp}**\n${fakeHp.map((i) => i).join("")}`
		).setThumbnail("attachment://boss.jpg")
		.attachFiles([ attachment ]);

	channel?.sendMessage(embed);
	return;
}

function consumeEnergy(
	lobby: RaidLobbyProps,
	user_id: number,
	multiplier = 1,
	totalDamage = 0
) {
	const member = lobby[user_id];
	if (!member) {
		delete lobby[user_id];
		return lobby;
	}
	member.energy = member.energy - Math.floor(multiplier * ENERGY_PER_ATTACK);
	if (member.energy < 0) member.energy = 0;
	member.total_attack = member.total_attack + multiplier;
	member.total_damage = member.total_damage + totalDamage;
	member.timestamp = Date.now();
	lobby[user_id] = member;

	return lobby;
}
