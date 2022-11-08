import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { DMChannel, TextChannel, ThreadChannel } from "discord.js";
import emoji from "emojis/emoji";
import { BOT_VOTE_LINK } from "environment";
import { numericWithComma } from "helpers";
import { CONSOLE_BUTTONS, DUNGEON_MAX_MANA } from "helpers/constants";
import loggers from "loggers";
import { battle } from "modules/commands/rpg/adventure";
import { floor } from "modules/commands/rpg/zoneAndFloor/floor";
import { zone } from "modules/commands/rpg/zoneAndFloor/zone";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { showRaidCommands } from "./consoleButtonFollowup/raids";
import { CustomButtonInteractionParams } from "@customTypes/button";
import { getCooldown } from "modules/cooldowns";
import { lottery } from "modules/commands/rpg/misc";
import { hourly } from "modules/commands/rpg/resource";
import { help } from "modules/commands/basic";
import { titleCase } from "title-case";

const prepareConsoleDescription = async (user: UserProps) => {
	const [ hourlyTTl, lotteryTTl, rconfig, disableRaids ] = await Promise.all([
		Cache.ttl("cooldown::hourly-" + user.user_tag),
		Cache.ttl("cooldown::lottery-" + user.user_tag),
		Cache.get("rconfig::" + user.user_tag),
		Cache.get("disable-raids"),
	]);

	let isEvent = false;
	if (disableRaids) {
		isEvent = true;
	}
	const cdKey = `${isEvent ? "event" : "raid"}-spawn`;
	const raidCD = await getCooldown(user.user_tag, cdKey);
	let remainingMins = 0,
		remainingHours = 0;
	let isRaidSpawnReady = false;
	if (raidCD) {
		const remainingTime =
      (new Date(raidCD.timestamp).valueOf() - new Date().valueOf()) / 1000;
		const remainingMS = remainingTime / 60;
		remainingHours = Math.floor(remainingMS / 60);
		remainingMins = Math.floor(remainingMS % 60);
	}
	if (remainingMins <= 0) {
		isRaidSpawnReady = true;
	}
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

	let lotteryTTlToMin = Math.ceil((lotteryTTl || 0) / 60);
	if (lotteryTTlToMin < 0) lotteryTTlToMin = 0;
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
    }\n\n**:ticket: Raid Spawn:** ${
    	isRaidSpawnReady
    		? "Ready"
    		: `${remainingHours} hours ${remainingMins} mins`
    }\n\n**:watch: Hourly**: ${
    	hourlyTTlToMin > 0 ? `${hourlyTTlToMin} mins` : "Ready"
    }\n**:tickets: Lottery:** ${
    	lotteryTTlToMin > 0 ? `${lotteryTTlToMin} mins` : "Ready"
    }\n**:alarm_clock: Vote:** ${
    	isVoteReady
    		? "Vote now!"
    		: `Vote in ${remainingVotingHours} hours ${remainingVotingMinutes} minutes`
    }\n**:droplet: Mana:** [ ${user.mana} / ${user.max_mana}]\n**${
    	emoji.crossedswords
    } DG Mana:** [ ${user.dungeon_mana} / ${DUNGEON_MAX_MANA} ]`;

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
			battle(options);
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
	const [ author, user ] = await Promise.all([
		client.users.fetch(user_tag),
		getRPGUser({ user_tag }),
	]);
	if (!user) {
		channel?.sendMessage(
			`Uh oh! Summoner **${author.username}**, please start your journey in the Xenverse ` +
        "using ``@izzi start``"
		);
		return;
	}
	const desc = await prepareConsoleDescription(user);
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
				params: { id: CONSOLE_BUTTONS.HOURLY.id }
			},
			{
				label: CONSOLE_BUTTONS.LOTTERY.label,
				params: { id: CONSOLE_BUTTONS.LOTTERY.id }
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
				params: { id: CONSOLE_BUTTONS.HELP.id }
			}
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

const showRaidCommandsWrapper = async (params: CustomButtonInteractionParams) => {
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
			battle(options);
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

type CProps = TextChannel | DMChannel | ThreadChannel;
export const prepareConsoleButton = (channel: CProps) => {
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
