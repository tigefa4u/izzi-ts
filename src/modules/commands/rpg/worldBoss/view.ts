import { AuthorProps } from "@customTypes";
import { SingleCanvasReturnType } from "@customTypes/canvas";
import { BaseProps } from "@customTypes/command";
import { RaidProps } from "@customTypes/raids";
import { getWorldBossRaid } from "api/controllers/WorldBossController";
import { Canvas } from "canvas";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import { getRemainingTimer, numericWithComma } from "helpers";
import { createBattleCanvas, createSingleCanvas } from "helpers/canvas";
import { DEFAULT_ERROR_TITLE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { prepareRaidBossEmbedDesc } from "../raids";
import { attackButton } from "./attackButton";

type P = {
  currentRaid: RaidProps;
  author: AuthorProps;
  client: Client;
};

const _prepareLoot = (raid: RaidProps) => {
	const bosses = raid.raid_boss.map((b) => titleCase(b.name)).join(",");
	const desc =
    `**__Rewards per Battle [For Everyone]__**\n__${raid.loot.drop.worldBoss?.gold}__ Gold ${emoji.gold}` +
    `\n__30x__ Platinum of **${bosses}**` +
    `\n\n**__Extra Rewards per Battle [Per Threshold]__**\n${raid.loot.drop.worldBoss?.default
    	.map((item) => {
    		return (
    			`**__${item.threshold}% Threshold__**\n__${numericWithComma(item.extraGold)}__ Gold ${emoji.gold}` +
                `\n__${item.souls}x__ Souls ${emoji.soul}` +
          `\n__${item.number}x__ ${titleCase(item.rank)} of **${bosses}** (At ${
          	item.rate
          }% per each card)` +
          `\n__1x__ **${titleCase(item.crates.category)}** Crate (At ${
          	item.crateDropRate
          }%)`
    		);
    	})
    	.join("\n\n")}`;
	return desc;
};

export const prepareWorldBossDesc = async ({
	currentRaid,
	author,
	client,
}: P) => {
	let bossCanvas: SingleCanvasReturnType | Canvas | undefined;
	if (currentRaid.raid_boss.length === 1) {
		bossCanvas = await createSingleCanvas(currentRaid.raid_boss[0], false);
	} else {
		bossCanvas = await createBattleCanvas(currentRaid.raid_boss, {
			isSingleRow: true,
			version: "medium",
		});
	}
	const startsInDt = new Date(currentRaid.created_at || "");
	const startsIn = startsInDt.setHours(startsInDt.getHours() + 1);
	const embed = createEmbed(author, client)
		.setTitle(
			`**World Boss View [${titleCase(currentRaid.stats.difficulty)}]**\n${
				currentRaid.is_start
					? `Ends: ${getRemainingTimer(currentRaid.stats.timestamp)}`
					: `Starts: ${getRemainingTimer(startsIn)}`
			}`
		)
		.setDescription(
			prepareRaidBossEmbedDesc(currentRaid, false, true, () => {
				return _prepareLoot(currentRaid);
			})
		)
		.setImage("attachment://boss.jpg")
		.setFooter({
			text: `World Boss ID: ${currentRaid.id}`,
			iconURL: author.displayAvatarURL(),
		})
		.setHideConsoleButtons(true);

	if (bossCanvas) {
		const attachment = createAttachment(
			bossCanvas.createJPEGStream(),
			"boss.jpg"
		);
		embed.attachFiles([ attachment ]);
	}

	return embed;
};

export const viewWorldBoss = async ({
	options,
	client,
	context,
}: BaseProps) => {
	try {
		const { author } = options;
		const raid = await getWorldBossRaid();
		let embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!raid) {
			embed.setDescription(
				`Summoner **${author.username}**, There is currently no World Boss Challenge. Check back later.`
			);
			context.channel?.sendMessage(embed);
			return;
		}

		embed = await prepareWorldBossDesc({
			currentRaid: raid,
			author,
			client,
		});

		const buttons = attackButton({
			channel: context.channel,
			bypassFilter: false,
			authorId: author.id,
		});
		if (buttons) {
			embed.setButtons(buttons);
		}
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("rpg.worldBoss.view.viewWorldBoss: ERROR", err);
		return;
	}
};
