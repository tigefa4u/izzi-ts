import { AuthorProps, ChannelProp } from "@customTypes";
import { CharacterStatProps } from "@customTypes/characters";
import { BaseProps } from "@customTypes/command";
import { BattleCardProps } from "@customTypes/stages";
import { UserProps } from "@customTypes/users";
import { pageFunc } from "api/controllers/PagingController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { getStageForBattle } from "api/controllers/StagesController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { getZoneByLocationId } from "api/controllers/ZonesController";
import Cache from "cache";
import { loadImage } from "canvas";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { baseStatRatio, calcPower, parsePremiumUsername, prepareAbilityDescription } from "helpers";
import { createSingleCanvas } from "helpers/canvas";
import { DEFAULT_ERROR_TITLE, DEFAULT_STARTER_GUIDE_TITLE, REQUIRED_TRADE_LEVEL } from "helpers/constants/constants";
import { RankProps } from "helpers/helperTypes";
import loggers from "loggers";
import { titleCase } from "title-case";
import { attachButtonToFloorEmbed } from ".";
import { handleDarkZoneFloor } from "./handleDarkZoneFloor";

async function prepareStageStats(params: {
  rank: RankProps;
  stageInfo: BattleCardProps;
}) {
	const PLStats = await getPowerLevelByRank({ rank: params.rank });
	if (!PLStats) return;
	const stats = {} as CharacterStatProps;
	const statsKeys = Object.keys(params.stageInfo.stats);
	statsKeys.forEach((stat) => {
		let statVal = params.stageInfo.stats[stat as keyof CharacterStatProps];
		if ([ "critical", "evasion", "accuracy" ].includes(stat))
			Object.assign(stats, { [stat]: statVal });
		else {
			statVal = baseStatRatio(statVal, PLStats.rank);
			const plVal = calcPower(PLStats, params.stageInfo.level, statVal);
			Object.assign(stats, { [stat]: plVal });
		}
	});
	return stats;
}

async function handleNextFloor(params: {
  user: UserProps;
  fl: string;
  channel: ChannelProp;
}) {
	const { user, fl } = params;

	let embed = createEmbed().setTitle(DEFAULT_ERROR_TITLE);
	if (
		(user.floor == user.max_floor && fl == "n") ||
    parseInt(fl) > user.max_floor
	) {
		const zone = await getZoneByLocationId({ location_id: user.ruin });
		const moveToFloor = fl === "n" ? user.floor + 1 : +fl;
		if (zone && (moveToFloor > zone.max_floor && user.max_ruin > zone.location_id)) {
			params.channel?.sendMessage(`Summoner **${user.username}**, you have cleared this zone! ` +
			"Use ``zone n`` to move on to the next one");
			return;
		}
		embed.setDescription(
			`Summoner **${user.username}**, you have not unlocked this floor yet!`
		);
		params.channel?.sendMessage(embed);
		return;
	} else {
		if (fl == "n") user.floor = user.floor + 1;
		else {
			user.floor = parseInt(fl);
			if (isNaN(user.floor)) {
				user.floor = 1;
			}
		}
	}
	await updateRPGUser({ user_tag: user.user_tag }, { floor: user.floor });
	const stage = await getStageForBattle({
		location_id: user.ruin,
		floor: user.floor,
	});
	if (!stage) {
		params.channel?.sendMessage(
			`You have moved to Zone ${user.ruin} Floor ${user.floor}, but we were not able to show Arena information`
		);
		throw new Error(
			"Unable to view floor for: location ID: " +
        user.ruin +
        " Floor: " +
        user.floor
		);
	}
	const stats = await prepareStageStats({
		rank: stage.rank,
		stageInfo: stage,
	});
	const passiveEmoji = emojiMap(stage.abilityname);
	const classEmoji = emojiMap(stage.type);
	const cardCanvas = await createSingleCanvas(stage, false);
	if (!cardCanvas) return;
	const attachment = createAttachment(cardCanvas.createJPEGStream(), "img.jpg");
	const atts = [ attachment ];
	stage.zone_filepath = stage.zone_filepath.replace("http://66.135.0.56:5013/", "https://assets.izzi-xenex.xyz/");
	try {
		await loadImage(stage.zone_filepath);
		const zoneAttachment = createAttachment(stage.zone_filepath, "zone.jpg");
		atts.push(zoneAttachment);
	} catch (err) {
		// loggers.error("Unable to load floor zone image:", err);
	}
	embed
		.setTitle(`Travelled to Arena [${user.ruin}-${user.floor}]`)
		.setDescription(
			`**:crossed_swords: FLOOR GUARDIAN:\n__${titleCase(stage.rank)}__ Level ${
				stage.level
			} ${titleCase(stage.name)}**\n**Element Type:** ${
				classEmoji ? classEmoji : ""
			}\n**RANK:** ${titleCase(stage.rank)}\n**${emoji.hp} HP:** ${
				stats?.strength
			}\n**${emoji.crossedswords} ATK:** ${stats?.vitality}\n**${emoji.armor} ARM:** ${
				stats?.intelligence
			}\n**${emoji.shield2} DEF:** ${stats?.defense}\n**${emoji.dash} SPD:** ${
				stats?.dexterity
			}\n\n**Ability**\n${passiveEmoji ? passiveEmoji : ""} **${titleCase(
				stage?.abilityname || ""
			)}** ${stage.is_passive ? "[PSV]" : ""}: ${prepareAbilityDescription(
				stage.abilitydescription,
				stage.rank
			)}`
		)
		.setImage("attachment://img.jpg")
		.setThumbnail("attachment://zone.jpg")
		.attachFiles(atts);

	if (user.level < REQUIRED_TRADE_LEVEL) {
		embed.setHideConsoleButtons(true);
	}

	embed = attachButtonToFloorEmbed({
		embed,
		channel: params.channel 
	});
	return embed;
}

async function handleZoneFloors(params: {
  user: UserProps;
  channel: ChannelProp;
  author: AuthorProps;
  client: Client;
}) {
	const zone = await getZoneByLocationId({ location_id: params.user.ruin });
	const stages: string[] = [];
	Array(params.user.max_floor)
		.fill(0)
		.map((v, i) => {
			stages.push(`Stage | ${params.user.ruin} - ${i + 1}\n\n`);
		});
	const title = "Stages/Floors";
	const description = `All the stages in **${titleCase(
		zone?.name || ""
	)}** you have unlocked are listed below.`;
	const pageName = "Stage";
	if (zone?.filepath) {
		zone.filepath = zone.filepath.replace("http://66.135.0.56:5013/", "https://assets.izzi-xenex.xyz/");
	}
	await pageFunc(stages, params.channel, params.author, {
		client: params.client,
		title,
		description,
		pageName,
		list: [],
		filepath: zone?.filepath,
	});
	return;
}

export const floor = async ({ context, client, options, args }: BaseProps) => {
	try {
		const author = options.author;
		const key = "guide::" + author.id;
		const [ user, starterGuide ] = await Promise.all([
			getRPGUser({ user_tag: author.id }),
			Cache.get(key)
		]);
		if (!user) return;
		if (args.includes("-dz")) {
			handleDarkZoneFloor({
				context,
				args,
				client,
				options 
			});
			return;
		}
		const fl = args.shift();
		if (!fl) {
			await handleZoneFloors({
				user,
				client,
				author,
				channel: context.channel,
			});
			return;
		}
		const embed = await handleNextFloor({
			user,
			fl,
			channel: context.channel
		});
		if (!embed) return;
		embed.setAuthor({
			name: parsePremiumUsername(author.username),
			iconURL: author.displayAvatarURL(),
		});
		context.channel?.sendMessage(embed);


		if (starterGuide) {
			await Cache.del(key);
			const userData = JSON.parse(starterGuide) as any;
			if (userData.moveToOrigin) {
				await updateRPGUser({ user_tag: author.id }, {
					floor: userData.floor,
					ruin: userData.ruin
				});
			}
			const guideEmbed = createEmbed(author, client).setTitle(DEFAULT_STARTER_GUIDE_TITLE + " Completed! " + 
			emoji.welldone)
				.setDescription(`Yay! Well done Summoner **${author.username}**!\n\n` +
			"Similarly, on completing a zone use ``iz zn n`` to move to the next zone in the Xenverse.\n\n" +
			"Congratulations on completing the starter guide! You are now ready to take on the " +
			"challenges and head on your own path.\n\nUse ``iz h`` for more commands" +
			"Hope your find the journey exciting and fun." +
			"\n\n**Collect atleast Legend Cards from Global Market to be able to do raids.**" +
			"\n\nHappy Collecting, GLHF!")
				.setFooter({
					text: "Guide will automatically expire in 10 mins",
					iconURL: author.displayAvatarURL() 
				}).setHideConsoleButtons(true);
			context.channel?.sendMessage(guideEmbed);
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.zoneAndFloor.floor: ERROR",
			err
		);
		return;
	}
};
