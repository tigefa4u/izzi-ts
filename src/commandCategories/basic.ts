import { BaseProps, CommandMapProps } from "@customTypes/command";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import commandMap from "modules/actions/reducer";

export const basics = async function ({
	context,
	client,
	args = [],
	command,
	options,
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function")
		commandMap[command?.name as keyof CommandMapProps]({
			context,
			client,
			args,
			options
		});
	return;
};

export const emotions =  async ({ context, command }: BaseProps) => {
	// const gif = await get(commandId);
	// const attachment = createAttachment(gif.url, "gif.gif");
	// const embed = createEmbed()
	// 	.setImage("attachment://gif.gif")
	// 	.attachFiles(attachment);
	// context.channel.sendMessage(embed);
	throw new Error("Unimplemented");
};
export const actions = async function ({ context, command, endPhrase, args }: any) {
	throw new Error("Unimplemented");
	// try {
	// 	if (command === "run") {
	// 		emotions({
	// 			context,
	// 			commandId: 139 
	// 		});
	// 		return;
	// 	}
	// 	const mentionedUser = await validateDiscordUser({
	// 		context,
	// 		user: args[1],
	// 	});
	// 	if (mentionedUser.UserNotFound) return;
	// 	const cmd = await getCommand(command);
	// 	if (!mentionedUser || (mentionedUser || {}).user.bot) {
	// 		const errorEmbed = createEmbed(context)
	// 			.setTitle("Error :no_entry:")
	// 			.setDescription(
	// 				`**Alias:** [${cmd.alias
	// 					.map((i) => i)
	// 					.join(", ")}]\n[Usage] **\`\`${cmd.usage}\`\`**`
	// 			);
	// 		context.channel.sendMessage(errorEmbed).catch((err) => {
	// 			logger.error(JSON.stringify(err));
	// 			return;
	// 		});
	// 		return;
	// 	}
	// 	let text = `**${context.author.username}** ${command}${
	// 		command.endsWith("ss") || command === "punch" ? "es" : "s"
	// 	} **${mentionedUser.user.username}**`;
	// 	if (endPhrase) text = text + ` ${endPhrase}`;
	// 	const gif = await get(cmd.id);
	// 	const attachment = createAttachment(gif.url, "gif.gif");
	// 	const embed = createEmbed(context)
	// 		.setDescription(text)
	// 		.setImage("attachment://gif.gif")
	// 		.attachFiles(attachment);
	// 	context.channel.sendMessage(embed);
	// 	return;
	// } catch (err) {
	// 	return;
	// }
};