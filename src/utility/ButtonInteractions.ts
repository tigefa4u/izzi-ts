import { ChannelProp, ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { createButton } from "commons/buttons";
import { MessageActionRow } from "discord.js";
import { buttonInteractionFilter } from "helpers";
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
		const buttons = new MessageActionRow().addComponents(
			createButton(REACTIONS.previous.label, { emoji: REACTIONS.previous.emoji }),
			createButton(REACTIONS.next.label, { emoji: REACTIONS.next.emoji }),
			createButton(REACTIONS.bin.label, {
				style: REACTIONS.bin.style,
				emoji: REACTIONS.bin.emoji,
			})
		);
		const collectorFilter = buttonInteractionFilter(authorId);

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
				case REACTIONS.bin.label: {
					callback(null, { isDelete: true });
					return;
				}
				case REACTIONS.next.label: {
					filter.currentPage < totalPages && (filter.currentPage += 1);
					break;
				}
				case REACTIONS.previous.label: {
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
		const buttons = new MessageActionRow().addComponents(
			createButton(REACTIONS.cancel.label, {
				emoji: REACTIONS.cancel.emoji,
				style: REACTIONS.cancel.style 
			}),
			createButton(REACTIONS.confirm.label, {
				emoji: REACTIONS.confirm.emoji,
				style: REACTIONS.confirm.style 
			})
		);
		const collectorFilter = buttonInteractionFilter(authorId);
		
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
				case REACTIONS.cancel.label: {
					callback(null, { isDelete: true });
					break;
				}
				case REACTIONS.confirm.label: {
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