import { titleCase } from "title-case";
import { BaseProps } from "@customTypes/command";
import { getCharacterInfo } from "api/controllers/CharactersController";
import { createAttachment } from "commons/attachments";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { createSingleCanvas } from "helpers/canvas";
import loggers from "loggers";
import { numericWithComma, overallStats, prepareStatsDesc } from "helpers";
import { getFloorsByCharacterId } from "api/controllers/StagesController";
import { Client, Message, MessageEmbed } from "discord.js";
import { NormalizeFloorProps } from "@customTypes/stages";
import { CharacterCardProps } from "@customTypes/characters";
import {
	BASE_RANK,
	CONSOLE_BUTTONS,
	DEFAULT_ERROR_TITLE,
} from "helpers/constants";
import { AuthorProps, ChannelProp, FilterProps } from "@customTypes";
import { selectionInteraction } from "utility/SelectMenuInteractions";
import {
	SelectMenuCallbackParams,
	SelectMenuOptions,
} from "@customTypes/selectMenu";
import { clone, groupByKey } from "utility";
import { PageProps } from "@customTypes/pagination";
import { getCharacterCardByRank } from "api/controllers/CardsController";
import {
	customButtonInteraction,
	paginatorInteraction,
} from "utility/ButtonInteractions";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { fetchParamsFromArgs } from "utility/forParams";
import { showCardSkins } from "./skinInfo";
import { CustomButtonInteractionParams } from "@customTypes/button";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { floor } from "modules/commands/rpg/zoneAndFloor/floor";
import { getZoneByLocationId } from "api/controllers/ZonesController";
import emoji from "emojis/emoji";
import { getCharacterPriceList } from "api/controllers/CharacterPriceListsController";
import { RankProps, RanksMetaProps } from "helpers/helperTypes";
import { getCustomServerCardByCharacterId } from "api/controllers/CustomServerCardsController";
import { ranksMeta } from "helpers/rankConstants";
import { getGuildByGuildIds } from "api/controllers/GuildsController";
import { GuildProps } from "@customTypes/guilds";

async function prepareCinfoDetails(
	embed: MessageEmbed,
	characterInfo: CharacterCardProps,
	location?: NormalizeFloorProps
) {
	const elementTypeEmoji = emojiMap(characterInfo?.type);
	const [ cardCanvas, customCardInfo ] = await Promise.all([
		createSingleCanvas(characterInfo, false),
		getCustomServerCardByCharacterId(characterInfo.character_id),
	]);
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

	const customCardServerInfo = (customCardInfo || [])[0];

	let serverInfo = "";
	if (customCardServerInfo?.guild_ids) {
		const guildIds = customCardServerInfo.guild_ids;
		const inviteLinks = (customCardServerInfo.metadata?.serverInviteLinks || "").split(",");
		const guilds = await getGuildByGuildIds(guildIds);
		if (guilds) {
			serverInfo = `${guildIds.map((g, i) => {
				const item: GuildProps | undefined = guilds.find((gg) => gg.guild_id === g);
				return `[${item?.guild_name}](${inviteLinks[i]})`;
			}).join(", ")}`;
		}
	}

	embed
		.setTitle(titleCase(characterInfo.name))
		.setDescription(
			`**Series:** ${titleCase(
				characterInfo.series.trim()
			)}\n**Card Copies:** ${characterInfo.copies}\n**Element:** ${titleCase(
				characterInfo.type
			)} ${elementTypeEmoji ? elementTypeEmoji : ""}\n**Zone:** ${
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
			}\n**Rank:** ${titleCase(characterInfo.rank)}\n${prepareStatsDesc(
				statsPrep,
				characterInfo.rank
			)}\n\n**Global Market Price ${emoji.shoppingcart}**\n${
				characterInfo.averageMarketPrice
					? `__${numericWithComma(characterInfo.averageMarketPrice)}__ Gold ${
						emoji.gold
					}`
					: "N/A"
			} (Low digit cards can be sold for higher price)${
				serverInfo
					? `\n\n**Available in Server(s)**\n${serverInfo}`
					: ""
			}`
		)
		.setImage("attachment://cinfo.jpg")
		.attachFiles([ attachment ])
		.setFooter({ text: `Added on: ${new Date(characterInfo.created_at).toLocaleDateString()}` });

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
			params.rank = params.rank[0]?.trim() as RankProps || BASE_RANK;
		} else {
			params.rank = BASE_RANK;
		}
		if (!cname) return;
		const charaInfo = await getCharacterInfo({
			name: cname.trim(),
			rank: params.rank,
		});
		const embed = createEmbed(options.author, client);
		if (!charaInfo || charaInfo.length <= 0) {
			embed
				.setTitle(DEFAULT_ERROR_TITLE)
				.setDescription("We could not find the Character you are looking for");

			context.channel?.sendMessage(embed);
			return;
		}
		if (charaInfo.length === 1) {
			await showCharacterDetails(
				options.author,
				charaInfo[0],
				context.channel,
				client,
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
					filterParams: { rank: params.rank },
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
		loggers.error("modules.commands.rpg.cardinfo.cinfo: ERROR", err);
		return;
	}
};

async function handleCharacterSelect(
	options: SelectMenuCallbackParams<{
    cards: CharacterCardProps[];
    filterParams?: { rank?: string };
  }>,
	value: string
) {
	if (!options.extras?.cards) return;
	const cardsMeta = groupByKey(options.extras.cards, "name");
	const character = cardsMeta[value][0];
	showCharacterDetails(
		options.author,
		character,
		options.channel,
		options.client,
		options.extras.filterParams
	);
	return;
}

const handleJumpToFloor = async ({
	client,
	channel,
	user_tag,
	id,
	message,
	location,
}: CustomButtonInteractionParams & { location: NormalizeFloorProps }) => {
	if (id !== CONSOLE_BUTTONS.JUMP_TO_FLOOR.id) return;
	const [ author, user, zoneDetails ] = await Promise.all([
		client.users.fetch(user_tag),
		getRPGUser({ user_tag }),
		getZoneByLocationId({ location_id: location.zone }),
	]);
	if (!user) {
		channel?.sendMessage(
			`Uh oh! Summoner **${author.username}**, please start your journey in the Xenverse ` +
        "using ``@izzi start``"
		);
		return;
	}
	if (!zoneDetails) {
		channel?.sendMessage(
			"We could not find the zone you were looking for. Please contact support."
		);
		return;
	}
	const options = {
		context: { channel } as BaseProps["context"],
		options: { author },
		args: [ `${location.floors[0]}` ],
		client,
	};

	if (location.zone > user.max_ruin) {
		channel?.sendMessage(
			`${DEFAULT_ERROR_TITLE} Summoner **${author.username}**, you have not unlocked this zone yet!`
		);
		return;
	} else if (
		location.floors[0] > user.max_ruin_floor &&
    location.zone === user.max_ruin
	) {
		channel?.sendMessage(
			`${DEFAULT_ERROR_TITLE} Summoner **${author.username}**, you have not unlocked this floor yet!`
		);
		return;
	}
	await updateRPGUser(
		{ user_tag: author.id },
		{
			ruin: location.zone,
			max_floor: zoneDetails.max_floor,
		}
	);
	floor(options);
	return;
};

/**
 * Main function that invokes card info details
 * @param author
 * @param character
 * @param channel
 * @param client
 * @param filterParams
 * @returns
 */
async function showCharacterDetails(
	author: AuthorProps,
	character: CharacterCardProps,
	channel: ChannelProp,
	client: Client,
	filterParams?: { rank?: string }
) {
	let embed = createEmbed(author);
	const location = await getFloorsByCharacterId({ character_id: character.id });
	const params = {
		author,
		character,
		refetchCard: false,
	};
	if (filterParams?.rank !== character.rank) {
		params.refetchCard = true;
	}
	let sentMessage: Message;
	const pageFilters = {
		currentPage: 1,
		perPage: 1,
	};
	if (filterParams?.rank) {
		const ranks = Object.keys(ranksMeta);
		const idx = ranks.findIndex((r) =>
			r.includes(filterParams.rank || ranksMeta.silver.name)
		);
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
				embed.setHideConsoleButtons(true);
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
	if (!buttons) return;
	if (location && location.zone > 0 && location.floors.length > 0) {
		const extraButtons = customButtonInteraction(
			channel,
			[
				{
					label: CONSOLE_BUTTONS.JUMP_TO_FLOOR.label,
					params: {
						id: CONSOLE_BUTTONS.JUMP_TO_FLOOR.id,
						location,
					},
				},
			],
			author.id,
			handleJumpToFloor,
			() => {
				return;
			},
			true,
			10
		);
		if (extraButtons) {
			buttons.components.push(...extraButtons.components);
		}
	}
	embed.setButtons(buttons);
	const msg = await channel?.sendMessage(embed);
	if (msg) {
		sentMessage = msg;
	}
	showCardSkins({
		author,
		channel,
		character,
		client,
	});
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
	const ranks = Object.keys(ranksMeta) as RankProps[];
	const rank = ranks.slice(filter.currentPage - 1, filter.currentPage)[0];
	const clonedCharacter = clone(params.character);
	if (params.refetchCard) {
		const [ card, characterPriceList ] = await Promise.all([
			getCharacterCardByRank({
				rank,
				character_id: params.character.id,
			}),
			getCharacterPriceList({
				characterId: params.character.id,
				rankId: ranksMeta[rank as keyof RanksMetaProps].rank_id,
			}),
		]);
		if (!card) {
			loggers.error(
				"cardinfo.fetchCharacterInfoMeta: " +
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
		clonedCharacter.copies = card.copies;
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
		clonedCharacter.averageMarketPrice =
      characterPriceList?.average_market_price;
	}
	if (rank === ranksMeta.silver.name) {
		clonedCharacter.stats = params.character.stats;
	}
	return {
		data: clonedCharacter,
		metadata: {
			totalCount: 10,
			totalPages: 10,
			...filter,
		},
	};
};
