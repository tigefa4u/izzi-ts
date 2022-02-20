import { AuthorProps, ChannelProp } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { getRandomCard } from "api/controllers/CardsController";
import { createCollection } from "api/controllers/CollectionsController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { getTeamById } from "api/controllers/TeamsController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { Client } from "discord.js";
import emoji from "emojis/emoji";
import { preparePlayerBase, probability, randomNumber } from "helpers";
import { preparePlayerStats } from "helpers/adventure";
import { sendBattleStatusEmbed } from "helpers/battle";
import {
	SPBT_REQUIRED_MANA,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
} from "helpers/constants";
import { prepareTeamForBattle } from "helpers/teams";
import loggers from "loggers";
import { getCooldown, sendCommandCDResponse, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { simulateBattle } from "../adventure/battle";
import { getSkinArr } from "../skins/skinCache";

export const spbt = async ({ options, context, client }: BaseProps) => {
	try {
		const author = options.author;
		const cd = await getCooldown(author.id, "spbt");
		if (cd) {
			sendCommandCDResponse(context.channel, cd, author.id, "spbt");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (!user.selected_team_id) {
			context.channel?.sendMessage("Please select a valid Team!");
			return;
		}
		if (user.mana < SPBT_REQUIRED_MANA) {
			context.channel?.sendMessage(
				`Summoner **${author.username}** ` +
          `You do not have enough mana to continue **[${user.mana} / ${SPBT_REQUIRED_MANA}]**`
			);
		}
		const team = await getTeamById({
			user_id: user.id,
			id: user.selected_team_id,
		});
		if (!team) {
			context.channel?.sendMessage(
				"We were unable to find your Team, please reset your teams!"
			);
			return;
		}
		const playerTeamStats = await prepareTeamForBattle({
			team,
			user_id: user.id,
			id: user.user_tag,
		});
		if (!playerTeamStats) {
			context.channel?.sendMessage(
				`We are unable to prepare __Team ${team.name}__. Please reset your team`
			);
			return;
		}
		const cardTypes = [ "exclusive", "ultimate" ];
		const probs = [ 50, 50 ];
		const rank = cardTypes[probability(probs)];
		const card = await getRandomCard(
			{
				series: "xenex",
				is_event: false,
				is_logo: false,
				rank,
			},
			1
		);
		if (!card) return;
		const L1 = Math.floor(playerTeamStats.totalStats.character_level * 2);
		const L2 = Math.floor(playerTeamStats.totalStats.character_level * 3);
		const enemyCard = {
			...card[0],
			character_level: randomNumber(L1, L2),
			user_id: 0,
			is_on_market: false,
			is_item: false,
			is_favorite: false,
			item_id: 0,
			exp: 0,
			r_exp: 0,
			rank_id: 0,
			souls: 0,
		} as CollectionCardInfoProps;

		const enemyStats = await preparePlayerStats({
			stats: enemyCard.stats,
			characterLevel: enemyCard.character_level,
			rank: enemyCard.rank,
		});

		const skin = prepareSpbtSkin(enemyCard.character_id);
		if (skin) {
			enemyCard.name = skin.name;
			enemyCard.filepath = skin.filepath;
		}
		const enemyBase = preparePlayerBase({
			id: "spbt",
			playerStats: enemyStats,
			card: enemyCard,
			name: `XeneX's ${titleCase(enemyCard.name)}`,
		});
		user.mana = user.mana - SPBT_REQUIRED_MANA;
		await updateRPGUser({ user_tag: user.user_tag }, { mana: user.mana });
		const battleStatus = await simulateBattle({
			context,
			playerStats: playerTeamStats,
			enemyStats: enemyBase,
			title: "__XeneX Special Battle__",
		});
		setCooldown(author.id, "spbt", 2700);
		if (battleStatus?.isVictory) {
			enemyCard.name = enemyBase.name;
			processVictoryAndSendEmbed(author, client, context.channel, enemyCard, user.id);
			return;
		} else {
			sendBattleStatusEmbed(author, client, context.channel);
		}
	} catch (err) {
		loggers.error("modules.commands.rpg.spbt(): something went wrong", err);
		return;
	}
};

function prepareSpbtSkin(id: number) {
	const skinArr = getSkinArr("spbt-skins");
	if (!skinArr) return;
	const found = skinArr.filter((s) => s.character_id === id);
	return found[0];
}

async function processVictoryAndSendEmbed(
	author: AuthorProps,
	client: Client,
	channel: ChannelProp,
	enemyCard: CollectionCardInfoProps,
	user_id: number
) {
	const drops = [ "platinum", "diamond", "legend" ];
	const dropRate = [ 75, 20, 5 ];
	const randomCard = await getRandomCard(
		{
			rank: drops[probability(dropRate)],
			is_event: false,
			is_logo: false,
			is_random: true,
		},
		1
	);
	if (!randomCard) {
		channel?.sendMessage("Unable to process your reward");
		throw new Error("Unable to fetch card for reward");
	}
	const card = randomCard[0];
	const powerLevel = await getPowerLevelByRank({ rank: card.rank });
	if (!powerLevel) {
		throw new Error("Power level not found for rank: " + card.rank);
	}
	await createCollection({
		character_id: card.character_id,
		character_level: STARTER_CARD_LEVEL,
		exp: STARTER_CARD_EXP,
		r_exp: STARTER_CARD_R_EXP,
		rank: card.rank,
		rank_id: powerLevel.rank_id,
		user_id,
		is_item: false,
	});
	const desc = `Congratulations **${
		author.username
	}!** You have defeated __${titleCase(enemyCard.rank)}__ **Level ${
		enemyCard.character_level
	} ${enemyCard.name}** in battle!\n•You have received 1 __${titleCase(
		card.rank
	)}__ copy of **${titleCase(card.name)}**`;
	sendBattleStatusEmbed(author, client, channel, desc, `Victory ${emoji.celebration}!`);
	return;
}
