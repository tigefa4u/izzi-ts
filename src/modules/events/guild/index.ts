import { ChannelProp } from "@customTypes";
import { CustomButtonInteractionParams } from "@customTypes/button";
import { delGuildItems } from "api/controllers/GuildItemsController";
import { delAllGuildMembers } from "api/controllers/GuildMembersController";
import { createGuild, disbandAndBackupGuild, getGuild, updateGuild } from "api/controllers/GuildsController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Client, Guild, TextChannel } from "discord.js";
import { IZZI_WEBSITE, OFFICIAL_SERVER_LINK, SLASH_COMMANDS_KEYBOARD_SHORTCUTS } from "environment";
import loggers from "loggers";
import { getWebsiteUrls } from "modules/commands/basic";
import { starterGuide } from "modules/commands/rpg/profile/guide";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { start } from "../../commands/rpg/profile/startJourney";

const startJourneyOrGuide = async ({ user_tag, channel, client, id }: CustomButtonInteractionParams) => {
	const author = await client.users.fetch(user_tag);
	if (!author) return;
	if (id === "start_journey") {
		return start({
			client,
			context: { channel } as any,
			options: { author },
			args: []
		});
	}
	return starterGuide({
		client,
		context: { channel } as any,
		options: { author },
		args: []
	});
};

export const handleDiscordServerJoin = async (client: Client, guild: Guild) => {
	try {
		let defaultChannel = {} as TextChannel;
		const guildExists = await getGuild({ guild_id: guild.id });
		if (!guildExists) {
			await createGuild({
				guild_id: guild.id,
				guild_name: guild.name,
				name: null,
				gold: 0,
				guild_level: 0,
				max_members: 15,
				is_active: true,
				prefix: "iz",
				is_banned: false,
				is_deleted: false,
				points: 0,
				max_admin_slots: 1
			});
		}
		const me = guild.me;
		if (!me) return;
		// finding the channel with send message permissions
		guild.channels.cache.forEach((channel) => {
			if (channel.type === "GUILD_TEXT" && Object.keys(defaultChannel).length === 0) {
				if (channel.permissionsFor(me).has("SEND_MESSAGES")) {
					defaultChannel = channel;
				}
			}
		});
		const attachment = createAttachment(
			"./assets/images/xenverse.png",
			"Xenverse.jpg"
		);
		const embed = createEmbed(undefined, client);
		embed
			.setTitle("Thanks for adding me!")
			.setDescription(
				"I'am **izzi**, thank you for adding me!\nI simulate a card collecting JRPG battle Arena staged in " +
                "**The Xenverse** with everything it needs!, " +
                "\nTo get started on your journey click on the ``Start Journey`` button " +
				"**(Ping the bot to start using commands)**. " +
				"Use ``iz help or @izzi help or /iz help`` to get all available commands." +
                `\nFor more assistance join our support server ${OFFICIAL_SERVER_LINK}. ` +
                `You can also find more information/command tutorials on ${IZZI_WEBSITE}. `
			)
			.setFooter({ text: "GLHF! Happy Collecting" })
			.setImage("attachment://Xenverse.jpg")
			.attachFiles([ attachment ])
			.setFooter({ text: "If the button doesnt work use ``iz start`` to start your journey in the Xenverse" });

		const buttons = await customButtonInteraction(
			defaultChannel,
			[
				{
					label: "Start Journey",
					params: {
						client,
						id: "start_journey" 
					}
				},
				{
					label: "Start Guide",
					params: {
						client,
						id: "guide" 
					}
				}
			],
			"",
			startJourneyOrGuide,
			() => {
				return;
			},
			true,
			50
		);
		if (buttons) {
			embed.setButtons(buttons);
		}
		defaultChannel.sendMessage(embed);

		const helpEmbed = createEmbed(undefined, client)
			.setTitle("Find Useful Urls Below")
			.setDescription(getWebsiteUrls());
		defaultChannel.sendMessage(helpEmbed);
		return;
	} catch (err) {
		loggers.error(
			"events.guild.handleDiscordServerJoin: ERROR",
			err
		);
		return;
	}
};

export const handleDiscordServerLeave = async (guild: Guild) => {
	try {
		const guildExists = await getGuild({ guild_id: guild.id });
		if (guildExists) {
			loggers.info("Deleting Guild: " + guildExists.guild_id);
			await disbandAndBackupGuild({ guild: guildExists });
		}
		return;
	} catch (err) {
		loggers.error(
			"events.guild.handleDiscordServerLeave: ERROR",
			err
		);
		return; 
	}
};