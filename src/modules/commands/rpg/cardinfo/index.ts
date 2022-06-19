import { titleCase } from "title-case";
import { BaseProps } from "@customTypes/command";
import { getCharacterInfo } from "api/controllers/CharactersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { createSingleCanvas } from "helpers/canvas";
import loggers from "loggers";
import { overallStats, prepareStatsDesc } from "helpers";
import { getFloorsByCharacterId } from "api/controllers/StagesController";
import { Message, MessageEmbed } from "discord.js";
import { NormalizeFloorProps } from "@customTypes/stages";
import { CharacterCardProps } from "@customTypes/characters";
import { DEFAULT_ERROR_TITLE, ranksMeta } from "helpers/constants";
import { AuthorProps, ChannelProp, FilterProps } from "@customTypes";
import { selectionInteraction } from "utility/SelectMenuInteractions";
import {
	SelectMenuCallbackParams,
	SelectMenuOptions,
} from "@customTypes/selectMenu";
import { clone, groupByKey } from "utility";
import { PageProps } from "@customTypes/pagination";
import { RanksMetaProps } from "helpers/helperTypes";
import { getCharacterCardByRank } from "api/controllers/CardsController";
import { paginatorInteraction } from "utility/ButtonInteractions";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { fetchParamsFromArgs } from "utility/forParams";

async function prepareCinfoDetails(
	embed: MessageEmbed,
	characterInfo: CharacterCardProps,
	location?: NormalizeFloorProps
) {
	const elementTypeEmoji = emojiMap(characterInfo?.type);
	const cardCanvas = await createSingleCanvas(characterInfo, true);
	if (!cardCanvas) throw "Unable to create canvas";
	const attachment = createAttachment(
		cardCanvas.createJPEGStream(),
		"cinfo.jpg"
	);
	const statsPrep = {
		...characterInfo.stats,
		abilityname: characterInfo.abilityname,
		abilitydescription: characterInfo.abilitydescription,
		is_passive: characterInfo.is_passive,
	};
	embed
		.setTitle(titleCase(characterInfo.name))
		.setDescription(
			`**Series:** ${titleCase(characterInfo.series)}\n**Card Copies:** ${
				characterInfo.copies
			}\n**Element Type:** ${titleCase(characterInfo.type)} ${
				elementTypeEmoji ? elementTypeEmoji : ""
			}\n**Zone:** ${
				location?.zone
					? location.zone
					: characterInfo.series.includes("event")
						? "Event"
						: "None"
			}\n**Floors:** ${
				location?.floors && location.floors.length > 0
					? location.floors.map((i) => i).join(", ")
					: characterInfo.series.includes("event")
						? "Event"
						: "None"
			}\n**RANK:** ${titleCase(characterInfo.rank)}\n${prepareStatsDesc(
				statsPrep
			)}`
		)
		.setImage("attachment://cinfo.jpg")
		.attachFiles([ attachment ]);

	return embed;
}

export const cinfo = async ({ context, client, args, options }: BaseProps) => {
	try {
		let cname = args.join(" ");
		const params = fetchParamsFromArgs<FilterProps>(args);
		if (params.name) {
			cname = params.name[0];
		}
		if (typeof params.rank === "object") {
			params.rank = params.rank[0];
		}
		if (!cname) return;
		const charaInfo = await getCharacterInfo({ name: cname.trim() });
		const embed = createEmbed(options.author, client);
		if (!charaInfo || charaInfo.length <= 0) {
			embed
				.setTitle(DEFAULT_ERROR_TITLE)
				.setDescription("We could not find the Character you are looking for");

			context.channel?.sendMessage(embed);
			return;
		}
		const abandonCardIndex = charaInfo.findIndex((c) => c.name === "luna");
		if (abandonCardIndex >= 0) {
			charaInfo.splice(abandonCardIndex, 1);
		}
		if (charaInfo.length === 1) {
			await showCharacterDetails(
				options.author,
				charaInfo[0],
				context.channel,
				{ rank: params.rank }
			);
			return;
		}
		embed
			.setTitle("Character Info")
			.setDescription(
				"We found multiple Characters that matched your requirement."
			);

		const selectMenuOptions = {
			menuOptions: charaInfo.map((c) => ({
				value: c.name,
				label: titleCase(c.name),
			})),
		} as SelectMenuOptions;
		const selectMenu = await selectionInteraction(
			context.channel,
			options.author.id,
			selectMenuOptions,
			{
				channel: context.channel,
				client,
				author: options.author,
				extras: {
					cards: charaInfo,
					filterParams: { rank: params.rank } 
				},
			},
			handleCharacterSelect
		);

		if (selectMenu) {
			embed.setButtons(selectMenu);
		}

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.cardinfo.cinfo(): something went wrong",
			err
		);
		return;
	}
};

async function handleCharacterSelect(
	options: SelectMenuCallbackParams<{ cards: CharacterCardProps[]; filterParams?: { rank?: string; } }>,
	value: string
) {
	if (!options.extras?.cards) return;
	const cardsMeta = groupByKey(options.extras.cards, "name");
	const character = cardsMeta[value][0];
	showCharacterDetails(options.author, character, options.channel, options.extras.filterParams);
	return;
}

async function showCharacterDetails(
	author: AuthorProps,
	character: CharacterCardProps,
	channel: ChannelProp,
	filterParams?: { rank?: string }
) {
	let embed = createEmbed(author);
	const location = await getFloorsByCharacterId({ character_id: character.id });
	const params = {
		author,
		character,
		refetchCard: false,
	};
	if (filterParams?.rank !== "silver") {
		params.refetchCard = true;
	}
	let sentMessage: Message;
	const pageFilters = {
		currentPage: 1,
		perPage: 1,
	};
	if (filterParams?.rank) {
		const ranks = Object.keys(ranksMeta);
		const idx = ranks.findIndex((r) => r.includes(filterParams.rank || "silver"));
		if (idx > 0) {
			pageFilters.currentPage = idx + 1;
		} else {
			pageFilters.currentPage = 1;
		}
	}
	const buttons = await paginatorInteraction(
		channel,
		author.id,
		params,
		pageFilters,
		fetchCharacterInfoMeta,
		async (data, opts) => {
			if (data) {
				params.refetchCard = true;
				embed = await prepareCinfoDetails(embed, data.data, location);
			} else {
				embed.setDescription("Unable to show character information.");
			}
			if (opts?.isDelete && sentMessage) {
				sentMessage.deleteMessage();
			}
			if (opts?.isEdit) {
				sentMessage.editMessage(embed);
			}
		}
	);
	if (buttons) {
		embed.setButtons(buttons);
	}
	const msg = await channel?.sendMessage(embed);
	if (msg) {
		sentMessage = msg;
	}
	return;
}

const fetchCharacterInfoMeta = async (
	params: {
    author: AuthorProps;
    character: CharacterCardProps;
    refetchCard?: boolean;
  },
	filter: PageProps
) => {
	const ranks = Object.keys(ranksMeta);
	const rank = ranks.slice(filter.currentPage - 1, filter.currentPage)[0];
	const clonedCharacter = clone(params.character);
	if (params.refetchCard) {
		const card = await getCharacterCardByRank({
			rank,
			character_id: params.character.id,
		});
		if (!card) {
			loggers.error(
				"cardinfo.fetchCharacterInfoMeta(): " +
          `Unable to find card for character ${params.character.name} with rank ${rank}`,
				{}
			);
			throw new Error(
				`Unable to find card for character ${params.character.name} with rank ${rank}`
			);
		}
		clonedCharacter.filepath = card.filepath;
		clonedCharacter.metadata = card.metadata;
		clonedCharacter.rank = card.rank;
		const PL = await getPowerLevelByRank({ rank: card.rank });
		if (!PL) {
			return;
		}
		const stats = overallStats({
			character_level: 1,
			powerLevel: PL,
			stats: clonedCharacter.stats,
		});
		clonedCharacter.stats = stats.totalStats;
	}
	if (rank === "silver") {
		clonedCharacter.stats = params.character.stats;
	}
	return {
		data: clonedCharacter,
		metadata: {
			totalCount: 9,
			totalPages: 9,
			...filter,
		},
	};
};
