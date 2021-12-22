import { titleCase } from "title-case";
import { BaseProps, CommandProps } from "@customTypes/command";
import { getAllCommands } from "api/controllers/CommandsController";
import { createEmbed } from "commons/embeds";
import { BOT_INVITE_LINK, IZZI_WEBSITE, PRIVACY_POLICY_URL } from "../../../environment";
import { EmbedFieldsProps } from "@customTypes";
import { Client, Message } from "discord.js";

function prepareSingleCommandEmbed(message: Message, client: Client, command: CommandProps) {
	const embed = createEmbed(message.member)
		.setTitle(
			`Command: ${command.name} (Shortcuts: ${command.alias
				.map((i) => i)
				.join(", ")})\n${command.usage ?? ""}`
		)
		.setThumbnail(client.user?.displayAvatarURL() || "")
		.setDescription((command.description || "This command probably does what it says").replace(/\\n/g, "\n"));
	
	return embed;
}

function prepareHelpDesc() {
	return "**Disclaimer:** You must have started your journey in the xenverse to use RPG commands." + " " +
			"Please start your journey using ``iz start`` command to do so." + " " +
			"When your character is created, you will receive a random starter __Diamond__ card." + "\n" +
			`For more information / tutorials you can check out ${IZZI_WEBSITE}` + "\n" +
			`**[Read our Privacy Policy](${PRIVACY_POLICY_URL})**`;
}

export const ping = async ({ message, client }: BaseProps) => {
	message.channel.sendMessage(
		`:ping_pong: Ping: **\`\`${
			Date.now() - message.createdTimestamp
		}ms\`\`** WS: **\`\`${Math.round(client.ws.ping)}ms\`\`**`
	);
};

export const invite = async ({ message, client }: BaseProps) => {
	const embed = createEmbed(message.member);
	embed
		.setAuthor("Izzi", client?.user?.displayAvatarURL())
		.setDescription(
			`Invite izzi into your server through the link:- ${BOT_INVITE_LINK}`
		);

	if (client.user) {
		embed
			.setThumbnail(client?.user?.displayAvatarURL())
			.setImage(client?.user?.displayAvatarURL());
	}
	message.channel.sendMessage(embed);
};

export const help = async ({ message, client, args = [] }: BaseProps) => {
	const cmd = args.shift();
	const allCommands = await getAllCommands();
	if (!allCommands) return;
	if (cmd) {
		const index = allCommands?.findIndex((c) => c.alias.includes(cmd)) || -1;
		if (index >= 0) {
			const command = allCommands[index];
			const newEmbed = prepareSingleCommandEmbed(message, client, command);
			message.channel.sendMessage(newEmbed);
		}
		return;
	}
	const commandGroup = allCommands.reduce((result: any, accumulator) => {
		(result[accumulator.type] =
      result[accumulator.type as keyof CommandProps] || []).push(accumulator);
		return result;
	}, {});
	const keys = Object.keys(commandGroup);
	const fields: EmbedFieldsProps[] = [];
	keys.map((key) => {
		fields.push({
			name: titleCase(key),
			value: `${commandGroup[key]
				.map((cmd: CommandProps) => cmd.name)
				.join("  ")}`,
			inline: true,
		});
	});
	const embed = createEmbed(message.member)
		.setTitle(":crossed_swords: Bot Commands :crossed_swords:")
		.setThumbnail(client.user?.displayAvatarURL() || "")
		.setDescription(prepareHelpDesc())
		.addFields(fields)
		.addField(
			"Usage",
			"**```iz help {command} for more info about the command.```**"
		)
		.setFooter(
			"Filters include -n (name) -r (rank) -t (element type) -a (ability)"
		);
	message.channel.sendMessage(embed);
	return;
};
