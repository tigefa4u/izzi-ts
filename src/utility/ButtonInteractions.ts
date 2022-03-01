import { ChannelProp, MapProps, ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { createButton } from "commons/buttons";
import { MessageActionRow } from "discord.js";
import { interactionFilter, generateUUID, verifyFilter } from "helpers";
import { REACTIONS } from "helpers/constants";
import loggers from "loggers";

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
		let result = await fetch(params, filter, options);
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
					filter.currentPage < totalPages && (filter.currentPage += 1);
					break;
				}
				case prevLabel: {
					filter.currentPage > 1 && (filter.currentPage -= 1);
					break;
				}
			}
			if (totalPages <= 1) return;
			if (filter.currentPage > totalPages) return;
			if (filter.currentPage < 1) return;
			result = await fetch(params, filter, options);
			callback(result, { isEdit: true });
			return;
		});
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
			buttonInteraction.deferUpdate();
			const id = buttonInteraction.customId;
			switch (id) {
				case cancelLabel: {
					callback(null, { isDelete: true });
					break;
				}
				case confirmLabel: {
					options = Object.assign({}, options);
					options.isConfirm = true;
					await fetch(params, options);
					callback(null, { isDelete: true });
					break;
				}
			}
			return;
		});
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
		const label = REACTIONS.confirm.label + "_" + generateUUID(4);
		const buttons = new MessageActionRow().addComponents(
			createButton(label, {
				style: "PRIMARY",
				label: "Claim"
			})
		);
		const collector = channel?.createMessageComponentCollector({
			filter: (Interaction) => verifyFilter(Interaction.customId, { label }),
			maxComponents: 1 
		});
		collector?.on("collect", async (buttonInteraction) => {
			buttonInteraction.deferUpdate();
			const id = buttonInteraction.customId;
			switch (id) {
				case label: {
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
		return buttons;
	} catch (err) {
		loggers.error("utility.ButtonInteractions.collectableInteraction(): something went wrong", err);
		return;
	}
};