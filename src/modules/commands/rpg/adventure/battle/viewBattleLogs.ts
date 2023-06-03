import { ChannelProp } from "@customTypes";
import { Simulation, SimulationRound } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { paginatorFunc } from "api/controllers/PagingController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { Message } from "discord.js";
import { generateUUID } from "helpers";
import { recreateBattleEmbed } from "helpers/battle";
import { createBattleCanvas } from "helpers/canvas";
import loggers from "loggers";
import { clone, isEmptyValue } from "utility";
import { paginatorInteraction } from "utility/ButtonInteractions";

type V = {
  simulation: Simulation;
  authorId: string;
  attachments: (CollectionCardInfoProps | undefined)[];
  channel: ChannelProp;
  isRaid?: boolean;
};
export const viewBattleLogs = async ({
	simulation,
	authorId,
	attachments,
	channel,
	isRaid
}: V) => {
	try {
		const rounds = simulation.rounds;
		const roundKeys = Object.keys(rounds);
		const initialKey = roundKeys.shift();
		if (!initialKey) {
			throw new Error("No rounds found in simulation");
		}

		/**
         * If the number of rounds are odd, we need to move the
         * last round description object to the first position of
         * the next round since pagination perpage is 2 and we
         * want the hp bars to be shown correctly.
         */
		let lastObject = {} as SimulationRound["descriptions"][0];
		const allDescriptions = roundKeys
			.map((key) => {
				const descriptionsToMap = rounds[key].descriptions;
				if (!isEmptyValue(lastObject)) {
					descriptionsToMap.unshift(lastObject);
					lastObject = {} as SimulationRound["descriptions"][0];
				}
				if (descriptionsToMap.length % 2 === 1) {
					const lastItem = descriptionsToMap.pop();
					if (lastItem) {
						lastObject = lastItem;
					}
				}
				return descriptionsToMap.map((d, i) =>
					i % 2 === 0 ? d.description : d.rawDescription || d.description
				);
			})
			.flat();

		if (!isEmptyValue(lastObject)) {
			allDescriptions.push(lastObject.description);
		}
		if (allDescriptions.length % 2 === 0) {
			const lastKey = roundKeys.pop();
			if (lastKey) {
				// Pop last 2 items and push the last battle description
				// obj to show correct hp bar.
				allDescriptions.pop();
				allDescriptions.pop();
    
				const lastDesc = rounds[lastKey].descriptions[
					rounds[lastKey].descriptions.length - 1
				].description;
				allDescriptions.push(lastDesc);
			}
		}
		const battleLogId = generateUUID(5);

		loggers.info(`Battle log ${battleLogId}`, {
			battleLogId,
			battleLog: allDescriptions
		});
		const embed = createEmbed()
			.setTitle(`__${simulation.title.replaceAll("_", "")} Battle Logs__`)
			.setDescription(allDescriptions[0])
			.setFooter({ text: `Battle Log ID: ${battleLogId}`, });

		const canvas = await createBattleCanvas(attachments, {
			isSingleRow: false,
			isRaid 
		});
		if (canvas) {
			const attachment = createAttachment(
				canvas.createJPEGStream(),
				"battle.jpg"
			);
			embed.attachFiles([ attachment ]).setImage("attachment://battle.jpg");
		}

		const filter = clone({
			currentPage: 1,
			perPage: 2,
		});
		const totalCount = allDescriptions.length;
		const totalPages = Math.ceil(totalCount / filter.perPage);
		let sentMessage: Message;
		const buttons = await paginatorInteraction<
      { array: string[] },
      string[],
      { totalCount: number; totalPages: number }
    >(
    	channel,
    	authorId,
    	{ array: allDescriptions },
    	filter,
    	paginatorFunc,
    	(data, opts) => {
    		let newEmbed;
    		if (data) {
    			newEmbed = recreateBattleEmbed(
    				embed.title || "",
    				data?.data.join("\n")
    			).setFooter({ text: `Battle Log ID: ${battleLogId}`, });
    		}
    		if (opts?.isDelete && sentMessage) {
    			sentMessage.deleteMessage();
    		}
    		if (opts?.isEdit && newEmbed) {
    			sentMessage.editMessage(newEmbed, { reattachOnEdit: true });
    		}
    	},
    	{
    		totalCount,
    		totalPages,
    	},
    	{ maxClicks: 100 }
    );
		if (buttons) {
			embed.setButtons(buttons).setHideConsoleButtons(true);
		}
		const msg = await channel?.sendMessage(embed);
		if (msg) {
			sentMessage = msg;
		}
		return;
	} catch (err) {
		loggers.error("battle.viewBattleLogs: ERROR", err);
		return;
	}
};
