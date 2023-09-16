import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { BOT_VOTE_LINK } from "environment";
import { numericWithComma } from "helpers";
import {
	CONSOLE_BUTTONS,
	DUNGEON_MAX_MANA,
	MAX_CHOSEN_SKINS_ALLOWED,
} from "helpers/constants";
import loggers from "loggers";
import { startBattle } from "modules/commands/rpg/adventure";
import { floor } from "modules/commands/rpg/zoneAndFloor/floor";
import { zone } from "modules/commands/rpg/zoneAndFloor/zone";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { showRaidCommands } from "./consoleButtonFollowup/raids";
import { CustomButtonInteractionParams } from "@customTypes/button";
import { getCDRemainingTime, getCooldown } from "modules/cooldowns";
import { lottery } from "modules/commands/rpg/misc";
import { hourly } from "modules/commands/rpg/resource";
import { help } from "modules/commands/basic";
import { getSkinArr } from "modules/commands/rpg/skins/skinCache";
import { ChannelProp } from "@customTypes";
import { GetTagTeamPlayer } from "api/controllers/TagTeamsController";
import { TagTeamPlayerProps } from "@customTypes/teams/tagTeams";

const prepareConsoleDescription = async (
	user: UserProps,
	tagTeamPlayer?: TagTeamPlayerProps & { points: number }
) => {
	const anonymousMarketPurchaseKey =
    "anonymous-market-purchase::" + user.user_tag;
	const [ hourlyTTl, lotteryTTl, disableRaids, anonymousMarketPurchase ] =
    await Promise.all([
    	Cache.ttl("cooldown::hourly-" + user.user_tag),
    	Cache.ttl("cooldown::lottery-" + user.user_tag),
    	Cache.get("disable-raids"),
    	Cache.get(anonymousMarketPurchaseKey),
    ]);

	let isEvent = false;
	if (disableRaids) {
		isEvent = true;
	}
	const cdKey = `${isEvent ? "event" : "raid"}-spawn`;
	const customSpawn = "raid-customspawn";
	const [ raidCD, customSpawnCD ] = await Promise.all([
		getCooldown(user.user_tag, cdKey),
		getCooldown(user.user_tag, customSpawn)
	]);
	let remainingMins = 0,
		remainingHours = 0,
		remainingSec = 0;
	let isRaidSpawnReady = false;
	if (raidCD) {
		const raidCdTimer = getCDRemainingTime(raidCD, user.user_tag, cdKey);
		remainingMins = raidCdTimer.remainingMinutes;
		remainingHours = raidCdTimer.remainingHours;
		remainingSec = raidCdTimer.remainingSec;
	}
	if (remainingSec <= 0 && remainingMins <= 0) {
		isRaidSpawnReady = true;
	}

	let cremainingMins = 0,
		cremainingHours = 0,
		cremainingSec = 0;
	let isCustomSpawnReady = false;
	if (customSpawnCD) {
		const customSpawnCDTimer = getCDRemainingTime(customSpawnCD, user.user_tag, customSpawn);
		cremainingMins = customSpawnCDTimer.remainingMinutes;
		cremainingHours = customSpawnCDTimer.remainingHours;
		cremainingSec = customSpawnCDTimer.remainingSec;
	}
	if (cremainingSec <= 0 && cremainingMins <= 0) {
		isCustomSpawnReady = true;
	}
	const selectedSkins = await getSkinArr(user.user_tag);
	// let raidSpawnDifficulty = "Use ``console rconfig <difficulty>(e/m/h/i)``";
	// if (rconfig) {
	// 	const { difficulty } = JSON.parse(rconfig);
	// 	raidSpawnDifficulty = titleCase(difficulty);
	// }
	const votedAt = user.voted_at;
	let isVoteReady = false;
	let remainingVotingHours = 0,
		remainingVotingMinutes = 0;
	if (!votedAt) isVoteReady = true;
	else {
		const dt = new Date(votedAt);
		const votedTime = dt.setHours(dt.getHours() + 12);
		const remainingTime = (votedTime - new Date().getTime()) / 1000 / 60;
		remainingVotingHours = Math.floor(remainingTime / 60);
		remainingVotingMinutes = Math.floor(remainingTime % 60);
		if (remainingVotingMinutes < 0) {
			isVoteReady = true;
		}
	}
	let hourlyTTlToMin = Math.ceil((hourlyTTl || 0) / 60);
	if (hourlyTTlToMin < 0) hourlyTTlToMin = 0;
	let hourlyTTlToSec = Math.ceil((hourlyTTl || 0) % 60);
	if (hourlyTTlToSec < 0) hourlyTTlToSec = 0;

	let lotteryTTlToMin = Math.ceil((lotteryTTl || 0) / 60);
	if (lotteryTTlToMin < 0) lotteryTTlToMin = 0;
	let lotteryTTlToSec = Math.ceil((lotteryTTl || 0) % 60);
	if (lotteryTTlToSec < 0) lotteryTTlToSec = 0;
	const desc =
    `**${emoji.premium} Premium Type:** ${
    	user.is_premium
    		? "Premium"
    		: user.is_mini_premium
    			? "Mini Premium"
    			: "None"
    }\n` +
    `**${emoji.gold} Gold:** ${numericWithComma(user.gold)}\n**${
    	emoji.shard
    } Shards:** ${numericWithComma(user.shards)}\n**${
    	emoji.blueorb
    } Orbs:** ${numericWithComma(user.orbs)}\n**${emoji.soul} Card Souls:** ${
    	user.souls
    }\n**:crossed_swords: Selected Skins** ${
    	selectedSkins?.length || 0
    } / ${MAX_CHOSEN_SKINS_ALLOWED}\n**:ninja: Username on Market Purchase: ${
    	anonymousMarketPurchase ? "Anonymous" : user.username
    } \`(use iz cons toggle)\`**\n\n**:ticket: Raid Permits:** ${
    	user.raid_pass
    } / ${user.max_raid_pass}\n**:ticket: Raid Spawn:** ${
    	isRaidSpawnReady
    		? "Ready"
    		: `${remainingHours} hours ${remainingMins} mins ${remainingSec} secs`
    }\n**:ticket: Custom Raid Spawn:** ${
    	isCustomSpawnReady
    		? "Ready"
    		: `${cremainingHours} hours ${cremainingMins} mins ${cremainingSec} secs`
    }\n**:watch: Hourly**: ${
    	hourlyTTlToMin > 0 && hourlyTTlToSec >= 0
    		? `${hourlyTTlToMin - 1} mins ${hourlyTTlToSec} secs`
    		: "Ready"
    }\n**:tickets: Lottery:** ${
    	lotteryTTlToMin > 0 && lotteryTTlToSec >= 0
    		? `${lotteryTTlToMin - 1} mins ${lotteryTTlToSec} secs`
    		: "Ready"
    }\n**:alarm_clock: Vote:** ${
    	isVoteReady
    		? "Vote now!"
    		: `Vote in ${remainingVotingHours} hours ${remainingVotingMinutes} minutes`
    }\n**:droplet: Mana:** ${user.mana} / ${user.max_mana}\n**${
    	emoji.crossedswords
    } DG Mana:** ${user.dungeon_mana} / ${DUNGEON_MAX_MANA}\n**${
    	emoji.crossedswords
    } Max Floor:** ${user.max_ruin_floor}\n**:map: Max Zone:** ${
    	user.max_ruin
    }${
    	tagTeamPlayer
    		? `\n**:raised_hands: Teammate | Points:** <@${
    			tagTeamPlayer.teammate
    		}> | ${numericWithComma(tagTeamPlayer.points || 0)}`
    		: ""
    }`;

	return desc;
};

const handleConsoleButtonInteractions = async ({
	channel,
	client,
	user_tag,
	id,
}: CustomButtonInteractionParams) => {
	const author = await client.users.fetch(user_tag);
	const options = {
		context: { channel } as BaseProps["context"],
		client,
		options: { author },
		args: [ "n" ],
	};
	switch (id) {
		case CONSOLE_BUTTONS.NEXT_FLOOR.id: {
			floor(options);
			return;
		}
		case CONSOLE_BUTTONS.FLOOR_BT.id: {
			options.args = [];
			startBattle(options);
			return;
		}
		case CONSOLE_BUTTONS.NEXT_ZONE.id: {
			zone(options);
			return;
		}
		case CONSOLE_BUTTONS.LOTTERY.id: {
			lottery(options);
			return;
		}
		case CONSOLE_BUTTONS.HOURLY.id: {
			hourly(options);
			return;
		}
		case CONSOLE_BUTTONS.HELP.id: {
			options.args = [];
			help(options);
			return;
		}
	}
};

export const prepareAndSendConsoleMenu = async ({
	channel,
	user_tag,
	client,
}: CustomButtonInteractionParams) => {
	const [ author, user, tagTeam ] = await Promise.all([
		client.users.fetch(user_tag),
		getRPGUser({ user_tag }),
		GetTagTeamPlayer({ user_tag }),
	]);
	if (!user) {
		channel?.sendMessage(
			`Uh oh! Summoner **${author.username}**, please start your journey in the Xenverse ` +
        "using ``@izzi start``"
		);
		return;
	}
	let tagTeamPlayer;
	if (tagTeam) {
		tagTeamPlayer = {
			...tagTeam.players[author.id],
			points: tagTeam.points,
		};
	}
	const desc = await prepareConsoleDescription(user, tagTeamPlayer);
	const embed = createEmbed(author, client)
		.setTitle("Console Menu " + emoji.crossedswords)
		.setDescription(desc)
		.setThumbnail(author.displayAvatarURL());

	const buttons = customButtonInteraction(
		channel,
		[
			{
				label: CONSOLE_BUTTONS.VOTE.label,
				params: { id: CONSOLE_BUTTONS.VOTE.id },
				style: "LINK",
				url: BOT_VOTE_LINK,
			},
			{
				label: CONSOLE_BUTTONS.HOURLY.label,
				params: { id: CONSOLE_BUTTONS.HOURLY.id },
			},
			{
				label: CONSOLE_BUTTONS.LOTTERY.label,
				params: { id: CONSOLE_BUTTONS.LOTTERY.id },
			},
			{
				label: CONSOLE_BUTTONS.FLOOR_BT.label,
				params: { id: CONSOLE_BUTTONS.FLOOR_BT.id },
			},
			{
				label: CONSOLE_BUTTONS.NEXT_FLOOR.label,
				params: { id: CONSOLE_BUTTONS.NEXT_FLOOR.id },
			},
			{
				label: CONSOLE_BUTTONS.NEXT_ZONE.label,
				params: { id: CONSOLE_BUTTONS.NEXT_ZONE.id },
			},
			{
				label: CONSOLE_BUTTONS.HELP.label,
				params: { id: CONSOLE_BUTTONS.HELP.id },
			},
		],
		author.id,
		handleConsoleButtonInteractions,
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
};

const showRaidCommandsWrapper = async (
	params: CustomButtonInteractionParams
) => {
	const author = await params.client.users.fetch(params.user_tag);
	const embed = createEmbed(author, params.client)
		.setTitle("Raid Commands")
		.setDescription("View all available Raid command buttons.")
		.setHideConsoleButtons(true);

	const message = await params.channel?.sendMessage(embed);
	if (message) {
		params.message = message;
		showRaidCommands(params);
	}
};

const handleIntemediateConsoleButtons = async ({
	channel,
	client,
	id,
	user_tag,
	message,
}: CustomButtonInteractionParams) => {
	const author = await client.users.fetch(user_tag);
	const options = {
		context: { channel } as BaseProps["context"],
		args: [ "all" ],
		client,
		options: { author },
	};
	switch (id) {
		case CONSOLE_BUTTONS.CONSOLE.id: {
			prepareAndSendConsoleMenu({
				channel,
				client,
				user_tag,
				id,
				message,
			});
			return;
		}
		case CONSOLE_BUTTONS.FLOOR_BT_ALL.id: {
			startBattle(options);
			return;
		}
		case CONSOLE_BUTTONS.RAID_COMMANDS.id: {
			showRaidCommandsWrapper({
				channel,
				client,
				id,
				user_tag,
				message,
			});
			return;
		}
	}
};

export const prepareConsoleButton = (channel: ChannelProp) => {
	try {
		return customButtonInteraction(
			channel,
			[
				{
					label: CONSOLE_BUTTONS.FLOOR_BT_ALL.label,
					params: { id: CONSOLE_BUTTONS.FLOOR_BT_ALL.id },
					isConsole: true,
				},
				{
					label: CONSOLE_BUTTONS.RAID_COMMANDS.label,
					params: { id: CONSOLE_BUTTONS.RAID_COMMANDS.id },
					isConsole: true,
				},
				{
					label: CONSOLE_BUTTONS.CONSOLE.label,
					params: { id: CONSOLE_BUTTONS.CONSOLE.id },
					style: "SECONDARY",
				},
			],
			"",
			handleIntemediateConsoleButtons,
			() => {
				return;
			},
			true,
			10
		);
	} catch (err) {
		loggers.error(
			"implementations.consoleButtons.prepareConsoleButton: ERROR",
			err
		);
		return;
	}
};
