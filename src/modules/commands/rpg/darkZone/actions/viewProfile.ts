import { DzFuncProps } from "@customTypes/darkZone";
import { DarkZoneProfileProps } from "@customTypes/darkZone/profile";
import { getDarkZoneProfile } from "api/controllers/DarkZoneController";
import { getRPGUser } from "api/controllers/UsersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { EmbedFieldData } from "discord.js";
import emoji from "emojis/emoji";
import { getIdFromMentionedString, numericWithComma } from "helpers";
import { createSingleCanvas } from "helpers/canvas";
import { DZ_INVENTORY_SLOTS_PER_LEVEL, DZ_STARTER_INVENTORY_SLOTS } from "helpers/constants/darkZone";
import loggers from "loggers";
import { titleCase } from "title-case";
import { DATE_OPTIONS } from "utility";

export const viewDzProfile = async ({
	context,
	client,
	args,
	options,
	dzUser: dzprofile,
}: DzFuncProps) => {
	try {
		const { author } = options;
		const mentionedId = getIdFromMentionedString(args.shift());
		let discordUser = author;
		if (mentionedId !== "" && mentionedId !== author.id) {
			discordUser = await client.users.fetch(mentionedId);
		}
		let dzUser: DarkZoneProfileProps | undefined = dzprofile;
		const promises: any[] = [
			getRPGUser({ user_tag: discordUser.id }),
		];
		if (discordUser.id !== author.id) {
			promises.push(
				getDarkZoneProfile({ user_tag: discordUser.id }).then(
					(res) => (dzUser = res)
				)
			);
		}
		const [ user ] = await Promise.all(promises);
		if (!dzUser || !user) {
			context.channel?.sendMessage(
				":x: The user you are looking for has not started their journey in the Dark Zone."
			);
			return;
		}
		const showcase = dzUser.metadata?.showcase;
		const maxSlots = (dzUser.level * DZ_INVENTORY_SLOTS_PER_LEVEL) + 
			(DZ_STARTER_INVENTORY_SLOTS - DZ_INVENTORY_SLOTS_PER_LEVEL);
		const fields: EmbedFieldData[] = [
			{
				name: `${user.is_premium ? emoji.premium : ""} Profile`,
				value: discordUser.username,
				inline: true,
			},
			{
				name: `${emoji.fragments} Fragments`,
				value: numericWithComma(dzUser.fragments),
				inline: true,
			},
			{
				name: `${emoji.crossedswords} Level`,
				value: numericWithComma(dzUser.level),
				inline: true,
			},
			{
				name: `${emoji.crossedswords} Inventory Slots Available`,
				value: `[${numericWithComma(dzUser.inventory_count)} / ${numericWithComma(maxSlots)}]`,
				inline: true
			},
			{
				name: `${emoji.manaic} Mana`,
				value: `[${user.mana} / ${user.max_mana}]`,
				inline: true,
			},
			{
				name: `${emoji.izzipoints} Izzi Points`,
				value: numericWithComma(user.izzi_points),
				inline: true,
			},
			{
				name: ":map: Current Floor",
				value: dzUser.floor.toString(),
				inline: true,
			},
			{
				name: ":map: Max Floors",
				value: dzUser.max_floor.toString(),
				inline: true,
			},
			{
				name: ":card_index: Exp",
				value: `[${dzUser.exp} / ${dzUser.r_exp}] exp`,
				inline: true,
			},
			{
				name: ":clock1: Started Playing From",
				value: new Date(dzUser.created_at).toLocaleDateString(
					"en-us",
					DATE_OPTIONS
				),
				inline: true,
			},
			{
				name: `${emoji.dagger} Showcase Card`,
				value: showcase?.name ? titleCase(showcase.name) : "None",
				inline: true,
			},
		];
		if (user.metadata.badges) {
			fields.splice(0, 0, {
				name: "Badges",
				value: user.metadata.badges.map((b: { emoji: string; }) => b.emoji).join(" "),
				inline: false,
			});
		}
		if (user.metadata.status) {
			fields.splice(0, 0, {
				name: `User Status ${emoji.chat}`,
				value: user.metadata.status,
				inline: false,
			});
		}
		const embed = createEmbed(discordUser, client)
			.setHideConsoleButtons(true)
			.addFields(fields)
			.setFooter({
				iconURL: discordUser.displayAvatarURL(),
				text: `User ID: ${discordUser.id}`,
			});

		
		if (showcase) {
			const canvas = await createSingleCanvas({
				type: showcase.type,
				rank: showcase.rank,
				filepath: showcase.filepath,
				metadata: showcase.metadata
			}, false, "medium");

			if (canvas) {
				const attachment = createAttachment(canvas.createJPEGStream(), "card.jpg");
				embed.attachFiles([ attachment ])
					.setImage("attachment://card.jpg");
			}
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("actions.viewDzProfile: ERROR", err);
		return;
	}
};
