import { titleCase } from "title-case";
import { BaseProps, CommandProps } from "@customTypes/command";
import { getAllCommands } from "api/controllers/CommandsController";
import { createEmbed } from "commons/embeds";
import { BOT_INVITE_LINK, IZZI_WEBSITE, PRIVACY_POLICY_URL } from "../../../environment";
import { Client, EmbedFieldData } from "discord.js";

function prepareSingleCommandEmbed(client: Client, command: CommandProps) {
	const embed = createEmbed(undefined, client)
		.setTitle(
			`Command: ${command.name} (Shortcuts: ${command.alias
				.map((i) => i)
				.join(", ")})\n${command.usage ?? ""}`
		)
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

export const ping = async ({ context, client }: BaseProps) => {
	context.channel?.sendMessage(
		`:ping_pong: Ping: **\`\`${
			Date.now() - context.createdTimestamp
		}ms\`\`** WS: **\`\`${Math.round(client.ws.ping)}ms\`\`**`
	);
};

export const invite = async ({ context, client }: BaseProps) => {
	const embed = createEmbed(undefined, client);
	embed
		.setAuthor({
			name: "IzzI",
			iconURL: client?.user?.displayAvatarURL()
		})
		.setDescription(
			`Invite izzi into your server through the link:- ${BOT_INVITE_LINK}`
		);

	if (client.user) {
		embed
			.setImage(client?.user?.displayAvatarURL());
	}
	context.channel?.sendMessage(embed);
};

export const help = async ({ context, client, args = [], options }: BaseProps) => {
	const cmd = args.shift();
	const allCommands = await getAllCommands();
	if (!allCommands) return;
	if (cmd) {
		const index = allCommands?.findIndex((c) => c.alias.includes(cmd)) || -1;
		if (index >= 0) {
			const command = allCommands[index];
			const newEmbed = prepareSingleCommandEmbed(client, command);
			context.channel?.sendMessage(newEmbed);
		}
		return;
	}
	const commandGroup = allCommands.reduce((result: any, accumulator) => {
		(result[accumulator.type] =
      result[accumulator.type as keyof CommandProps] || []).push(accumulator);
		return result;
	}, {});
	const keys = Object.keys(commandGroup);
	const fields: EmbedFieldData[] = [];
	keys.map((key) => {
		fields.push({
			name: titleCase(key),
			value: `${commandGroup[key]
				.map((cmd: CommandProps) => cmd.name)
				.join(" ")}`,
			inline: true,
		});
	});
	const embed = createEmbed(options.author, client)
		.setTitle(":crossed_swords: Bot Commands :crossed_swords:")
		.setDescription(prepareHelpDesc())
		.addFields(fields)
		.addField(
			"Usage",
			"**```iz help {command} for more info about the command.```**"
		)
		.setFooter({ text: "Filters include -n (name) -r (rank) -t (element type) -a (ability)" });
	context.channel?.sendMessage(embed);
	return;
};
