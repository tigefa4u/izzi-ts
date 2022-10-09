import { ChannelProp, MapProps, ResponseWithPagination } from "@customTypes";
import { ButtonOptions } from "@customTypes/button";
import { PageProps } from "@customTypes/pagination";
import { createButton } from "commons/buttons";
import { Client, Message, MessageActionRow } from "discord.js";
import { interactionFilter, generateUUID, verifyFilter } from "helpers";
import { REACTIONS } from "helpers/constants";
import loggers from "loggers";
import { clone } from "utility";

export const paginatorInteraction: <P, T, O = Record<string, never>>(
  channel: ChannelProp,
  authorId: string,
  params: P,
  filter: PageProps,
  fetch: (params: P, filter: PageProps, options?: O) => Promise<ResponseWithPagination<T> | undefined>,
  callback: (pageResult?: ResponseWithPagination<T> | null, options?: { isDelete?: boolean, isEdit?: boolean }) => void,
  options?: O
) => Promise<MessageActionRow | undefined> = async (channel, authorId, params, filter, fetch, callback, options) => {
	try {
		const pageFilter = clone(filter);
		const prevLabel = REACTIONS.previous.label + "_" + generateUUID(4);
		const nextLabel = REACTIONS.next.label + "_" + generateUUID(4);
		const binLabel = REACTIONS.bin.label + "_" + generateUUID(4);
		const buttons = new MessageActionRow().addComponents(
			createButton(prevLabel, { emoji: REACTIONS.previous.emoji }),
			createButton(nextLabel, { emoji: REACTIONS.next.emoji }),
			createButton(binLabel, {
				style: REACTIONS.bin.style,
				emoji: REACTIONS.bin.emoji,
			})
		);
		const collectorFilter = interactionFilter(authorId, verifyFilter, {
			prevLabel,
			nextLabel,
			binLabel
		});

		const collector = channel?.createMessageComponentCollector({
			filter: collectorFilter,
			maxComponents: 10, // Max number of clicks
		});
		let result = await fetch(params, pageFilter, options);
		callback(result);
		const totalPages = result?.metadata.totalPages || 0;

		collector?.on("collect", async (buttonInteraction) => {
			buttonInteraction.deferUpdate();
			const id = buttonInteraction.customId;
			switch (id) {
				case binLabel: {
					callback(null, { isDelete: true });
					return;
				}
				case nextLabel: {
					pageFilter.currentPage < totalPages && (pageFilter.currentPage += 1);
					break;
				}
				case prevLabel: {
					pageFilter.currentPage > 1 && (pageFilter.currentPage -= 1);
					break;
				}
			}
			if (totalPages <= 1) return;
			if (pageFilter.currentPage > totalPages) return;
			if (pageFilter.currentPage < 1) return;
			result = await fetch(params, pageFilter, options);
			callback(result, { isEdit: true });
			return;
		});

		// collector?.on("dispose", (interaction) => {
		// 	const message = interaction.message as Message;
		// 	message.components.map((c) => c.components.map((component) => component.setDisabled(true)));
		// 	message.editButton([ ...message.components ][0]);
		// 	return;
		// });

		// collector?.on("end", (collected) => {
		// 	collected.map((interaction) => {
		// 		const message = interaction.message as Message;
		// 		message.components.map((c) => c.components.map((component) => component.setDisabled(true)));
		// 		message.editButton([ ...message.components ][0]);
		// 	});
		// 	return;
		// });
	
		return buttons;
	} catch (err) {
		loggers.error("utility.ButtonInteractions.paginatorInteraction(): something went wrong", err);
		return;
	}
};

export const confirmationInteraction = async <P, T, O = Record<string, never>>(
	channel: ChannelProp,
	authorId: string,
	params: P,
	fetch: (params: P, options?: O & { isConfirm: boolean }) => Promise<T | undefined>,
	callback: (data?: T | null, opts?: { isDelete: boolean }) => void,
	options?: O & { isConfirm: boolean }
): Promise<MessageActionRow | undefined> => {
	try {
		const confirmLabel = REACTIONS.confirm.label + "_" + generateUUID(4);
		const cancelLabel = REACTIONS.confirm.label + "_" + generateUUID(4);
		const buttons = new MessageActionRow().addComponents(
			createButton(confirmLabel, {
				emoji: REACTIONS.confirm.emoji,
				style: REACTIONS.confirm.style 
			}),
			createButton(cancelLabel, {
				emoji: REACTIONS.cancel.emoji,
				style: REACTIONS.cancel.style 
			})
		);
		const collectorFilter = interactionFilter(authorId, verifyFilter, {
			cancelLabel,
			confirmLabel
		});
		
		const collector = channel?.createMessageComponentCollector({
			filter: collectorFilter,
			maxComponents: 1
		});
		const isValid = await fetch(params, options);
		if (!isValid) return;
		callback(isValid);

		collector?.on("collect", async (buttonInteraction) => {
			const id = buttonInteraction.customId;
			switch (id) {
				case cancelLabel: {
					buttonInteraction.deferUpdate();
					callback(null, { isDelete: true });
					break;
				}
				case confirmLabel: {
					buttonInteraction.deferUpdate();
					options = Object.assign({}, options);
					options.isConfirm = true;
					await fetch(params, options);
					callback(null, { isDelete: true });
					break;
				}
			}
			return;
		});

		// collector?.on("dispose", (interaction) => {
		// 	const message = interaction.message as Message;
		// 	message.components.map((c) => c.components.map((component) => component.setDisabled(true)));
		// 	message.editButton([ ...message.components ][0]);
		// 	return;
		// });

		// collector?.on("end", (collected) => {
		// 	collected.map((interaction) => {
		// 		const message = interaction.message as Message;
		// 		message.components.map((c) => c.components.map((component) => component.setDisabled(true)));
		// 		message.editButton([ ...message.components ][0]);
		// 	});
		// 	return;
		// });
	
		return buttons;
	} catch (err) {
		loggers.error("utility.ButtonInteractions.confirmationInteraction(): something went wrong", err);
		return;
	}
};

export const collectableInteraction = async <P>(
	channel: ChannelProp,
	params: P,
	fetch: (params: P & { user_tag: string; channel: ChannelProp; }) => void,
	callback: () => void
) => {
	try {
		const label = REACTIONS.confirm.label + "_" + (channel?.id || "") + "_" + generateUUID(4);
		const buttons = new MessageActionRow().addComponents(
			createButton(label, {
				style: "PRIMARY",
				label: "Claim"
			})
		);
		const collector = channel?.createMessageComponentCollector({
			filter: (Interaction) => verifyFilter(Interaction.customId, { label }),
			max: 1,
			componentType: "BUTTON",
			dispose: true,
			time: 240_000
		});
		collector?.on("collect", (buttonInteraction) => {
			const id = buttonInteraction.customId;
			switch (id) {
				case label: {
					buttonInteraction.deferUpdate();
					fetch({
						...params,
						user_tag: buttonInteraction.user.id,
						channel
					});
					callback();
					break;
				}
			}
			return;
		});

		// collector?.on("dispose", (interaction) => {
		// 	const message = interaction.message as Message;
		// 	message.components.map((c) => c.components.map((component) => component.setDisabled(true)));
		// 	message.editButton([ ...message.components ][0]);
		// 	return;
		// });

		// collector?.on("end", (collected) => {
		// 	collected.map((interaction) => {
		// 		const message = interaction.message as Message;
		// 		message.components.map((c) => c.components.map((component) => component.setDisabled(true)));
		// 		message.editButton([ ...message.components ][0]);
		// 	});
		// 	return;
		// });
	
		return buttons;
	} catch (err) {
		loggers.error("utility.ButtonInteractions.collectableInteraction(): something went wrong", err);
		return;
	}
};

export const customButtonInteraction = <P>(
	channel: ChannelProp,
	options: (ButtonOptions & { params: P })[],
	authorId: string,
	fetch: (params: P & { user_tag: string; channel: ChannelProp; client: Client; message: Message; }) => void,
	callback: () => void,
	bypassFilter?: boolean,
	maxClicks = 1
) => {
	try {
		const label = REACTIONS.confirm.label + "_" + (channel?.id || "") + "_" + generateUUID(4);
		const verifyObject = {};
		const buttons = new MessageActionRow().addComponents(
			options.map((option, i) => {
				const labelStr = label + "_" + i;
				Object.assign(verifyObject, { [labelStr]: labelStr });
				return createButton(labelStr, option);
			})
		);
		const collector = channel?.createMessageComponentCollector({
			filter: bypassFilter ? () => true : interactionFilter(authorId, verifyFilter, verifyObject),
			max: maxClicks,
			componentType: "BUTTON",
			dispose: true,
			time: 240_000
		});
		// To disabled buttons on end - edit the message, setting the new buttons
		collector?.on("collect", (buttonInteraction) => {
			const id = buttonInteraction.customId;
			options.map((option, i) => {
				if (id === (label + "_" + i)) {
					buttonInteraction.deferUpdate();
					fetch({
						...option.params,
						user_tag: buttonInteraction.user.id,
						channel,
						client: buttonInteraction.client,
						message: buttonInteraction.message as Message
					});
					callback();
				}
			});
			return;
		});

		// collector?.on("dispose", (interaction) => {
		// 	const message = interaction.message as Message;
		// 	message.components.map((c) => c.components.map((component) => component.setDisabled(true)));
		// 	message.editButton([ ...message.components ][0]);
		// 	return;
		// });

		// collector?.on("end", (collected) => {
		// 	collected.map((interaction) => {
		// 		const message = interaction.message as Message;
		// 		message.components.map((c) => c.components.map((component) => component.setDisabled(true)));
		// 		message.editButton([ ...message.components ][0]);
		// 	});
		// 	return;
		// });
		return buttons;
	} catch (err) {
		loggers.error("utility.ButtonInteractions.customInteraction(): something went wrong", err);
		return;
	}
};