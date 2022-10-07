import { ChannelProp } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { Client, DMChannel, TextChannel, ThreadChannel } from "discord.js";
import emoji from "emojis/emoji";
import { BOT_VOTE_LINK } from "environment";
import { numericWithComma } from "helpers";
import { CONSOLE_BUTTONS, DUNGEON_MAX_MANA } from "helpers/constants";
import loggers from "loggers";
import { battle } from "modules/commands/rpg/adventure";
import { floor } from "modules/commands/rpg/zoneAndFloor/floor";
import { zone } from "modules/commands/rpg/zoneAndFloor/zone";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { raidActions } from "modules/commands/rpg/raids/index";
import { eventActions } from "modules/commands/rpg/raids/events";

const prepareConsoleDescription = async (user: UserProps) => {
	const hourlyTTl = await Cache.ttl("cooldown::hourly-" + user.user_tag);
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
	let hourlyTTlToMin = Math.ceil(hourlyTTl / 60);
	if (hourlyTTlToMin < 0) hourlyTTlToMin = 0;
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
    }\n\n**:watch: Hourly**: ${
    	hourlyTTlToMin > 0 ? `${hourlyTTlToMin} mins` : "Ready"
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
}: P) => {
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
	}
};

type P = {
  channel: ChannelProp;
  user_tag: string;
  client: Client;
  id: string;
};
const prepareAndSendConsoleMenu = async ({ channel, user_tag, client }: P) => {
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
		.setDescription(desc);

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

const handleIntemediateConsoleButtons = async ({
	channel,
	client,
	id,
	user_tag,
}: P) => {
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
			});
			return;
		}
		case CONSOLE_BUTTONS.FLOOR_BT_ALL.id: {
			battle(options);
			return;
		}
		case CONSOLE_BUTTONS.RAID_BATTLE.id: {
			const disableRaids = await Cache.get("disable-raids");
			const disableEvents = await Cache.get("disable-events");
			let isEvent = false;
			if (disableEvents || !disableRaids) {
				channel?.sendMessage("There are currently no events.");
				return;
			} else if (disableRaids && !disableEvents) {
				isEvent = true;
			}
			options.args = [ "bt" ];
			if (isEvent) {
				eventActions(options);
			} else {
				raidActions(options);
			}
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
				},
				{
					label: CONSOLE_BUTTONS.RAID_BATTLE.label,
					params: { id: CONSOLE_BUTTONS.RAID_BATTLE.id },
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
			"implementations.consoleButtons.prepareConsoleButton(): ERROR",
			err
		);
		return;
	}
};
