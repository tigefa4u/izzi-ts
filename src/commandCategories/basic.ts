import { BaseProps, CommandMapProps } from "@customTypes/command";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import commandMap from "modules/actions/reducer";

export const basics = async function ({
	message,
	client,
	args = [],
	command,
	options,
}: BaseProps) {
	args = args.slice(1);
	if (typeof commandMap[command?.name as keyof CommandMapProps] === "function")
		commandMap[command?.name as keyof CommandMapProps]({
			message,
			client,
			args,
			options
		});
	return;
};

export const emotions =  async ({ message, command }: BaseProps) => {
	// const gif = await get(commandId);
	// const attachment = createAttachment(gif.url, "gif.gif");
	// const embed = createEmbed(message.member)
	// 	.setImage("attachment://gif.gif")
	// 	.attachFiles(attachment);
	// message.channel.sendMessage(embed);
	throw new Error("Unimplemented");
};
export const actions = async function ({ message, command, endPhrase, args }: any) {
	throw new Error("Unimplemented");
	// try {
	// 	if (command === "run") {
	// 		emotions({
	// 			message,
	// 			commandId: 139 
	// 		});
	// 		return;
	// 	}
	// 	const mentionedUser = await validateDiscordUser({
	// 		message,
	// 		user: args[1],
	// 	});
	// 	if (mentionedUser.UserNotFound) return;
	// 	const cmd = await getCommand(command);
	// 	if (!mentionedUser || (mentionedUser || {}).user.bot) {
	// 		const errorEmbed = createEmbed(message)
	// 			.setTitle("Error :no_entry:")
	// 			.setDescription(
	// 				`**Alias:** [${cmd.alias
	// 					.map((i) => i)
	// 					.join(", ")}]\n[Usage] **\`\`${cmd.usage}\`\`**`
	// 			);
	// 		message.channel.sendMessage(errorEmbed).catch((err) => {
	// 			logger.error(JSON.stringify(err));
	// 			return;
	// 		});
	// 		return;
	// 	}
	// 	let text = `**${message.author.username}** ${command}${
	// 		command.endsWith("ss") || command === "punch" ? "es" : "s"
	// 	} **${mentionedUser.user.username}**`;
	// 	if (endPhrase) text = text + ` ${endPhrase}`;
	// 	const gif = await get(cmd.id);
	// 	const attachment = createAttachment(gif.url, "gif.gif");
	// 	const embed = createEmbed(message)
	// 		.setDescription(text)
	// 		.setImage("attachment://gif.gif")
	// 		.attachFiles(attachment);
	// 	message.channel.sendMessage(embed);
	// 	return;
	// } catch (err) {
	// 	return;
	// }
};