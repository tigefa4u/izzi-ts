import { BaseProps } from "@customTypes/command";
import { createButton } from "commons/buttons";
import { MessageActionRow } from "discord.js";
import emoji from "emojis/emoji";
import { generateUUID, getIdFromMentionedString, probability } from "helpers";
import loggers from "loggers";

export const payRespect = async ({ context, client, options, args }: BaseProps) => {
	try {
		const { author } = options;
		const thingOrUser = args.join(" ");
		let item = author.username;
		if (thingOrUser) {
			const id = getIdFromMentionedString(thingOrUser);
			try {
				const mentionedUser = await client.users.fetch(id);
				item = mentionedUser.username;
			} catch (err) {
				//
				item = thingOrUser;
			}
		}
		const payRespectButton = emoji.respect + "_" + generateUUID(4);
		const buttons = new MessageActionRow().addComponents(
			createButton(payRespectButton, {
				emoji: emoji.respect,
				style: "PRIMARY",
			})
		);
		const collector = context.channel?.createMessageComponentCollector({
			filter: (collec) => collec.customId === payRespectButton,
			time: 15_000,
		});
		collector?.on("collect", (interaction) => {
			interaction.reply({
				content: `You have paid your respects to **${item}**`,
				ephemeral: true
			});
			return;
		});
		collector?.on("end", (collected) => {
			context.channel?.sendMessage(`**__${collected.size}__** summoners have paid their respects to **${item}**`);
		});
		context.channel?.send({
			content: `Pay respects to **${item}**. Press F :pray:`,
			components: [ buttons ]
		});
		return;
	} catch (err) {
		loggers.error("commands.basics.funCommands.payRespect: ERROR", err);
		return;
	}
};

export const izziChoose = async ({ context, options, args }: BaseProps) => {
	try {
		const { author } = options;
		args = args.join(" ").split("|");
		const opt1 = args.shift()?.trim();
		const opt2 = args.shift()?.trim();
		if (!opt1 || !opt2) {
			context.channel?.sendMessage(`Summoner **${author.username}**, Please provide 2 Options to choose from.`);
			return;
		}
		const chosenText = [ opt1, opt2 ][probability([ 50, 50 ])];
		context.channel?.sendMessage(`I choose **${chosenText}**`);
		return;
	} catch (err) {
		loggers.error("commands.basics.funCommands.izziChoose: ERROR", err);
		return;
	}
};