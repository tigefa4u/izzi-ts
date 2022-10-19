import { titleCase } from "title-case";
import { BaseProps, CommandProps } from "@customTypes/command";
import { getAllCommands } from "api/controllers/CommandsController";
import { createEmbed } from "commons/embeds";
import {
	BOT_INVITE_LINK,
	GUIDE_DOCS,
	IZZI_WEBSITE,
	PRIVACY_POLICY_URL,
	SLASH_COMMANDS_KEYBOARD_SHORTCUTS,
} from "../../../environment";
import { Client, EmbedFieldData } from "discord.js";
import { groupByKey } from "utility";
import { AuthorProps, ChannelProp } from "@customTypes";
import { selectionInteraction } from "utility/SelectMenuInteractions";
import {
	SelectMenuCallbackParams,
	SelectMenuOptions,
} from "@customTypes/selectMenu";
import loggers from "loggers";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { CONSOLE_BUTTONS } from "helpers/constants";

function prepareSingleCommandEmbed(client: Client, command: CommandProps) {
	const embed = createEmbed(undefined, client)
		.setTitle(
			`Command: ${command.name} (Shortcuts: ${command.alias
				.map((i) => i)
				.join(", ")})\n${command.usage ?? ""}`
		)
		.setDescription(
			(
				command.description || "This command probably does what it says"
			).replace(/\\n/g, "\n")
		);

	return embed;
}

function prepareHelpDesc() {
	return (
		"**Disclaimer:** You must have started your journey in the xenverse to use RPG commands." +
    " " +
    "Please start your journey using ``iz start`` command to do so." +
    " " +
    "When your character is created, you will receive a random starter __Diamond__ card." +
    "\n" +
    `For more information / tutorials you can check out ${IZZI_WEBSITE}` +
    "\n" +
    `If you are below level __25__ you will receive free claimable cards. checkout ${IZZI_WEBSITE}/@me` +
    "\n" +
    `**[Read our Privacy Policy](${IZZI_WEBSITE}/privacy-policy)**\n` +
	`Check out our [community guide](${SLASH_COMMANDS_KEYBOARD_SHORTCUTS}) for more tips.`
	);
}

export const ping = async ({ context, client }: BaseProps) => {
	context.channel?.sendMessage(
		`:ping_pong: Ping: **\`\`${
			Date.now() - context.createdTimestamp
		}ms\`\`** WS: **\`\`${Math.round(client.ws.ping)}ms\`\`**`
	);
	return;
};

export const invite = async ({ context, client }: BaseProps) => {
	const embed = createEmbed(undefined, client);
	embed
		.setAuthor({
			name: "IzzI",
			iconURL: client?.user?.displayAvatarURL(),
		})
		.setDescription(
			`Invite izzi into your server through the link:- ${BOT_INVITE_LINK}`
		);

	if (client.user) {
		embed.setImage(client?.user?.displayAvatarURL());
	}
	context.channel?.sendMessage(embed);
};

export const help = async ({
	context,
	client,
	args = [],
	options,
}: BaseProps) => {
	try {
		const cmd = args.shift();
		const allCommands = await getAllCommands();
		if (!allCommands) return;
		if (cmd) {
			const index = allCommands.findIndex((c) => c.alias.includes(cmd)) ?? -1;
			if (index >= 0) {
				const command = allCommands[index];
				const newEmbed = prepareSingleCommandEmbed(client, command);
				context.channel?.sendMessage(newEmbed);

				followUp(command, context.channel, options.author, client);
			}
			return;
		}
		const commandGroup = groupByKey(allCommands, "type");
		const keys = Object.keys(commandGroup);
		const fields: EmbedFieldData[] = [];
		keys.map((key) => {
			fields.push({
				name: titleCase(key),
				value: `${commandGroup[key]
					.map((cmd: CommandProps) => cmd.name)
					.join(", ")}`,
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
			.setFooter({ text: "Filters include -n (name) -r (rank) -t (element type) -a (ability)", });

		const buttons = customButtonInteraction(
			context.channel,
			[
				{
					label: CONSOLE_BUTTONS.GUIDE.label,
					params: { id: CONSOLE_BUTTONS.GUIDE.id },
					style: "LINK",
					url: GUIDE_DOCS
				},
				{
					label: CONSOLE_BUTTONS.CHANGE_LOGS.label,
					params: { id: CONSOLE_BUTTONS.CHANGE_LOGS.id },
					style: "LINK",
					url: `${GUIDE_DOCS}/change-logs`
				}
			],
			options.author.id,
			() => {
				return;
			},
			() => {
				return;
			},
			true
		);
		const rulesEmbed = createEmbed(options.author, client)
			.setTitle("IzzI Rules")
			.setDescription("**WHEN AND WHY WILL I GET PERMANENT BOT BANNED?**\n" +
				"• Botting, Scripting, cheating to gain unfair advantage over others.\n" +
				"• Cross trading of any form.\n" +
				"• Using multiple accounts (alt-ing) to gain unfair advantage.\n" +
				"• Malicious/Suspicious activity.\n" +
				"• Supporting someone who is doing these.\n" + 
				"**Note: Exchanging izzi assets for any other assets, real money or server roles " +
				"is considered Cross Trading**");
			
		if (buttons) {
			rulesEmbed.setButtons(buttons);
		}
		context.channel?.sendMessage(embed);
		context.channel?.sendMessage(rulesEmbed);
	} catch (err) {
		loggers.error("modules.commands.basic.help(): something went wrong", err);
	}
	return;
};

async function followUp(
	command: CommandProps,
	channel: ChannelProp,
	author: AuthorProps,
	client: Client
) {
	try {
		if (Object.keys(command.sub_commands || {}).length <= 0) return;
		const menuOptions = Object.keys(command.sub_commands).map((key) => {
			return {
				label: command.sub_commands[key].title.replaceAll(/\*\*/g, ""),
				value: key,
			};
		});

		const options: SelectMenuOptions = {
			extras: { placeholder: "Select a sub command" },
			menuOptions,
		};

		const embed = createEmbed()
			.setTitle(`${command.name} Followup Commands`)
			.setDescription("All the sub commands are listed below.");
		const params = {
			author,
			channel,
			client,
			extras: { command },
		};
		const selectMenu = await selectionInteraction(
			channel,
			author.id,
			options,
			params,
			handleFollowUp,
			{ max: menuOptions.length } // Allow to choose multiple items
		);

		if (selectMenu) {
			embed.setButtons(selectMenu);
		}
		channel?.sendMessage(embed);
	} catch (err) {
		loggers.error(
			"modules.commands.basic.followUp(): something went wrong",
			err
		);
	}
	return;
}

function handleFollowUp(
	params: SelectMenuCallbackParams<{ command: CommandProps }>,
	value?: string
) {
	const command = params.extras?.command;
	if (!value || !command) return;
	const subcommand =
    command.sub_commands[value as keyof CommandProps["sub_commands"]];

	const embed = createEmbed()
		.setTitle(subcommand.title)
		.setDescription(subcommand.description.replace(/\\n/g, "\n"));
	params.channel?.sendMessage(embed);
	return;
}

export const websiteUrls = ({ context, options, client, command }: BaseProps) => {
	if (!command) return;
	const embed = createEmbed(options.author, client)
		.setTitle(
			`Command: ${command.name} (Shortcuts: ${command.alias.join(", ")})\n${
				command.usage
			}`
		)
		.setDescription(getWebsiteUrls());

	context.channel?.sendMessage(embed);
	return;
};

export const getWebsiteUrls = () => 
	`**All useful links are listed below**\n\n**Website:** ${IZZI_WEBSITE}\n` +
`**Skins:** ${IZZI_WEBSITE}/skins\n**Event Redeem:** ${IZZI_WEBSITE}/events\n` +
`**Tutorial Blogs:** ${IZZI_WEBSITE}/blogs\n**Premium Packs:** ${IZZI_WEBSITE}/premiums` +
`\n**Commands:** ${IZZI_WEBSITE}/commands\n**Abilities:** ${IZZI_WEBSITE}/abilities\n` +
`**Items:** ${IZZI_WEBSITE}/items\n**Donate:** ${IZZI_WEBSITE}/donate`;