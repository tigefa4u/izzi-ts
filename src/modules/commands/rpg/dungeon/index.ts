import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { ItemProps } from "@customTypes/items";
import { getRandomCard } from "api/controllers/CardsController";
import { getItems } from "api/controllers/ItemsController";
import {
	createUserRank,
	getUserRank,
} from "api/controllers/UserRanksController";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { randomElementFromArray } from "helpers";
import {
	DEFAULT_ERROR_TITLE,
	DUNGEON_DEFAULTS,
	HIDE_VISUAL_BATTLE_ARG,
	MANA_PER_BATTLE,
} from "helpers/constants";
import {
	prepareSkewedCollectionsForBattle,
	validateAndPrepareTeam,
} from "helpers/teams";
import loggers from "loggers";
import { titleCase } from "title-case";
import { simulateBattle } from "../adventure/battle/battle";
import { computeLevel } from "./computeLevel";
import * as battlesInChannel from "../adventure/battle/battlesPerChannelState";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { UserRankProps } from "@customTypes/userRanks";
import { handleDungeonBattleOutcome } from "./rewards";
import { refetchAndUpdateUserMana, validateFiveMinuteTimer } from "helpers/battle";
import { addTeamEffectiveness } from "helpers/adventure";

export const dungeon = async ({ context, client, options, args }: BaseProps) => {
	try {
		const author = options.author;
		const seasonEnd = await Cache.get("dg-season-end");
		if (seasonEnd) {
			context.channel?.sendMessage("Ranked Dungeon battles have Ended.");
			return;
		}
		const today = new Date();
		const day = today.getDay();
		if ([ 4, 5 ].includes(day)) {
			context.channel?.sendMessage(
				"Ranked Dungeon battles are disabled on Thursday and Friday"
			);
			return;
		}
		const battles = battlesInChannel.validateBattlesInChannel(context.channel?.id || "");
		if (battles === undefined) return;
		let inBattle = await getCooldown(author.id, "mana-battle");
		if (inBattle) {
			await validateFiveMinuteTimer({
				timestamp: inBattle.timestamp,
				key: `cooldown::mana-battle-${author.id}` 
			});
			context.channel?.sendMessage("Your battle is still in progress, try again later");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (user.mana < MANA_PER_BATTLE) {
			embed.setDescription(
				`You do not have enough mana to battle **[${user.mana} / ${MANA_PER_BATTLE}]**`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		if (!user.selected_team_id) {
			context.channel?.sendMessage("Please select your battle team!");
			return;
		}
		const teamPrepared = await validateAndPrepareTeam(
			user.id,
			user.user_tag,
			user.selected_team_id,
			context.channel
		);
		if (!teamPrepared) return;
		const playerTeamStats = teamPrepared.stats;
		let userRank = await getUserRank({ user_tag: author.id });
		if (!userRank) {
			userRank = await createUserRank({
				r_exp: DUNGEON_DEFAULTS.r_exp,
				rank: DUNGEON_DEFAULTS.rank,
				exp: DUNGEON_DEFAULTS.exp,
				rank_id: DUNGEON_DEFAULTS.rank_id,
				wins: DUNGEON_DEFAULTS.wins,
				loss: DUNGEON_DEFAULTS.loss,
				user_tag: author.id,
				division: DUNGEON_DEFAULTS.division,
			});
		}
		const dungeonBoss = await prepareDungeonBoss(userRank);
		const enemyStats = await prepareSkewedCollectionsForBattle({
			collections: dungeonBoss,
			id: "Dungeon Boss",
			name: "XeneX's Dungeon Boss"
		});
		const { playerStats: effectiveStats, opponentStats: opponentEffectiveStats } = await addTeamEffectiveness({
			cards: playerTeamStats.cards,
			enemyCards: enemyStats.cards,
			playerStats: playerTeamStats.totalStats,
			opponentStats: enemyStats.totalStats 
		});

		playerTeamStats.totalStats = effectiveStats;
		enemyStats.totalStats = opponentEffectiveStats;
		inBattle = await getCooldown(author.id, "mana-battle");
		if (inBattle) return;
		setCooldown(author.id, "mana-battle", 60 * 5);
		const hideBt = (args.shift() || "").toLowerCase();
		const result = await simulateBattle({
			context,
			playerStats: playerTeamStats,
			enemyStats,
			title: `Dungeon Battle [${titleCase(userRank?.rank || "duke")}]`,
			options: { hideVisualBattle: hideBt === HIDE_VISUAL_BATTLE_ARG ? true : false }
		});
		await refetchAndUpdateUserMana(author.id);
		clearCooldown(author.id, "mana-battle");
		if (result?.isForfeit) return;
		await handleDungeonBattleOutcome({
			author,
			client,
			userRank,
			result,
			channel: context.channel
		});
		return;
	} catch (err) {
		loggers.error("modules.commands.rpg.dungeon(): something went wrong", err);
		return;
	}
};

async function prepareDungeonBoss(userRank?: UserRankProps) {
	const rankWithItem = computeLevel("grand master");
	let itemsArray = [] as ItemProps[];
	if ((userRank?.rank_id || 1) >= rankWithItem.rank_id) {
		const allItems = await getItems({}, {
			currentPage: 1,
			perPage: 20
		});
		itemsArray = allItems?.data || [];
	}
	return Promise.all(
		Array(userRank?.division)
			.fill("0")
			.map(async () => {
				const computed = computeLevel(userRank?.rank);
				const card = await getRandomCard(
					{
						rank: computed.rank,
						is_random: true,
						is_event: false,
						is_logo: false,
					},
					1
				);
				if (!card) return {} as CollectionCardInfoProps;
				let item;
				if ((userRank?.rank_id || 1) >= rankWithItem.rank_id) {
					item = randomElementFromArray(itemsArray);
				}
				return {
					...card[0],
					character_level: Math.floor(
						(computed.level / (userRank?.division || 1)) *
            ((userRank?.division || 1) * 1.2)
					),
					user_id: 0,
					is_on_market: false,
					is_item: false,
					exp: 0,
					r_exp: 0,
					rank_id: 0,
					souls: 0,
					item_id: item?.id || 0,
					itemname: item?.name,
					itemStats: item?.stats,
					itemdescription: item?.description
				} as CollectionCardInfoProps;
			})
	);
}