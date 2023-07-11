import { BattleStats } from "@customTypes/adventure";
import { BaseProps } from "@customTypes/command";
import { DungeonBanProps } from "@customTypes/dungeon";
import { TeamProps } from "@customTypes/teams";
import { UserRankProps } from "@customTypes/userRanks";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { getDGTeam, getRandomDGOpponent, updateDGTeam } from "api/controllers/DungeonsController";
import { getUserBlacklist } from "api/controllers/UserBlacklistsController";
import { createUserRank, getUserRank } from "api/controllers/UserRanksController";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import transaction from "db/transaction";
import { emojiMap } from "emojis";
import { addTeamEffectiveness } from "helpers/adventure";
import { refetchAndUpdateUserMana, validateFiveMinuteTimer } from "helpers/battle";
import {
	BATTLE_TYPES, DEFAULT_ERROR_TITLE, DUNGEON_DEFAULTS, DUNGEON_MANA_PER_BATTLE, DUNGEON_MIN_LEVEL 
} from "helpers/constants";
import { prepareSkewedCollectionsForBattle, prepareTeamForBattle } from "helpers/teams";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { clone, groupByKey } from "utility";
import { battleConfirmationInteraction } from "utility/ButtonInteractions";
import { prepareDungeonBoss } from "..";
import { simulateBattle } from "../../adventure/battle/battle";
import * as battlesInChannel from "../../adventure/battle/battlesPerChannelState";
import { processBattleOutcome } from "./rewards";

// dungeon V2
const spawnDGBoss = async (userRank?: UserRankProps) => {
	const dungeonBoss = await prepareDungeonBoss(userRank);
	const enemyStats = await prepareSkewedCollectionsForBattle({
		collections: dungeonBoss,
		id: "Dungeon Boss",
		name: "XeneX's Dungeon Boss [BOT]"
	});
	enemyStats.isBot = true;
	return enemyStats;
};

export const dungeonBattle = async (params: BaseProps) => {
	return battleConfirmationInteraction({
		...params,
		invokeFunc: invokeDungeonBattle
	});
};

const dedupItems = (playerStats: any) => {
	const result = clone(playerStats);
	const validCards = result.cards.filter((c: any) => typeof c === "object");
	const itemsEquipped = groupByKey(validCards, "item_id");
	const duplicateItems = Object.keys(itemsEquipped).filter((k) => itemsEquipped[k].length > 1);
	
	// duplicateItems will always either be of length 1 or 0 because only 3 items can be equipped.
	if (duplicateItems.length > 0) {
		const duplicateItemId = Number(duplicateItems[0]);
		const idx = result.cards.findIndex((c: any) => c?.item_id === duplicateItemId);
		if (idx >= 0) {
			delete result.cards[idx]?.itemname;
			delete result.cards[idx].item_id;
		}
	}
	return result;
};

export const invokeDungeonBattle = async ({ context, options, client }: BaseProps) => {
	try {
		const author = options.author;
		const [ seasonEnd, bans ] = await Promise.all([
			Cache.get("dg-season-end"),
			Cache.get("dg-bans")
		]);

		let dungeonBans: DungeonBanProps = {};
		if (bans) {
			dungeonBans = JSON.parse(bans);
		}
		if (seasonEnd) {
			context.channel?.sendMessage("Ranked Dungeon battles have Ended.");
			return;
		}
		// const today = new Date();
		// const day = today.getDay();
		// if ([ 4, 5 ].includes(day)) {
		// 	context.channel?.sendMessage(
		// 		"Ranked Dungeon battles are disabled on Thursday and Friday"
		// 	);
		// 	return;
		// }
		const battles = battlesInChannel.validateBattlesInChannel(context.channel?.id || "");
		if (battles === undefined) return;
		const cdKey = "dungeon-battle";
		let inBattle = await getCooldown(author.id, cdKey);
		if (inBattle) {
			await validateFiveMinuteTimer({
				timestamp: inBattle.timestamp,
				key: `cooldown::${cdKey}-${author.id}` 
			});
			context.channel?.sendMessage("Your battle is still in progress, try again later");
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (user.level < DUNGEON_MIN_LEVEL) {
			embed.setDescription(`You must be atleast **level __${DUNGEON_MIN_LEVEL}__** ` +
			"to be able to participate in Dungeon Battles.");
			context.channel?.sendMessage(embed);
			return;
		}
		if (user.dungeon_mana < DUNGEON_MANA_PER_BATTLE) {
			embed.setDescription(
				`You do not have enough dungeon mana to battle **[${user.dungeon_mana} / ${DUNGEON_MANA_PER_BATTLE}]**`
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const [ dgTeam, _userRank, blackList ] = await Promise.all([
			getDGTeam(author.id),
			getUserRank({ user_tag: author.id }),
			getUserBlacklist({ user_tag: author.id })
		]);
		if (dgTeam && blackList && blackList.length > 0) {
			// dgTeam.metadata.isValid = false;
			if (dgTeam.metadata.isValid) {
				await updateDGTeam(author.id, {
					metadata: {
						...dgTeam.metadata,
						isValid: false
					}
				});
			}
			const warningEmbed = createEmbed(author, client)
				.setTitle("Warning :warning:").setDescription(
					"You have been blacklisted and cannot participate in DG Ranked Challenge. Please contact support."
				);
			context.channel?.sendMessage(warningEmbed);
			return;
		}
		if (!dgTeam?.team) {
			embed.setDescription(`Summoner **${author.username}**, You do not have a DG Team! Create a DG Team ` +
            "using ``iz dg create <name>``");

			context.channel?.sendMessage(embed);
			return;
		} else if (!dgTeam.metadata.isValid) {
			embed.setDescription(`Summoner **${author.username}**, Your DG Team is not ready to battle! ` +
            "Use ``iz dg ready`` to participate in DG Battles!");

			context.channel?.sendMessage(embed);
			return; 
		}
		if (dungeonBans.itemBans || dungeonBans.abilityBans) {
			// const collections = await getCollectionById({ ids: [] });
			const bannedItems = (dungeonBans.itemBans || []).map((i) => i.name);
			const bannedAbilities = (dungeonBans.abilityBans || []).map((i) => i.name);
			let hasBannedAbilities = false;
			if (dungeonBans.abilityBans) {
				const cids: number[] = [];
				dgTeam.team.metadata.map((m) => {
					if (m.collection_id) cids.push(m.collection_id);
				});
				const collections = await getCollectionById({
					ids: cids,
					user_id: user.id 
				});
				if (collections) {
					const itemFound = collections.find((c) => bannedAbilities.includes(c.abilityname));
					if (itemFound) hasBannedAbilities = true;
				}
			}
			const hasBannedItems = dgTeam.team.metadata.find((meta) => {
				if (meta.itemName && bannedItems.includes(meta.itemName)) {
					return true;
				}
				return false;
			});
			if (hasBannedItems || hasBannedAbilities) {
				await updateDGTeam(author.id, {
					metadata: {
						...dgTeam.metadata,
						isValid: false
					}
				});
				embed.setTitle(DEFAULT_ERROR_TITLE)
					.setDescription(`Summoner **${author.username}**, Your DG Team has Banned Items or Abilities.` +
				" Set a valid Team to Battle!\n\nUse ``iz dg bans`` to view all banned abilities and items.");
	
				context.channel?.sendMessage(embed);
				return;
			}
		}
		let userRank = _userRank;
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

		let playerStats = await prepareTeamForBattle({
			team: dgTeam.team as TeamProps,
			user_id: user.id,
			id: author.id,
			canAddGuildStats: false,
			isDungeon: true,
			capCharacterMaxLevel: true
		});
		if (!playerStats) {
			embed.setDescription("You do not have a valid DG Team, Please reset your team using ``iz dg reset``");
			await updateDGTeam(author.id, {
				metadata: {
					...dgTeam.metadata,
					isValid: false
				}
			});
			context.channel?.sendMessage(embed);
			return;
		}
		playerStats = dedupItems(playerStats);
		let opponent: BattleStats | undefined, opponentTeamName = "";
		const randomOpponent = await getRandomDGOpponent({
			exclude_tag: author.id,
			rank_id: userRank?.rank_id || 1
		});
		/**
		 * If opponent doesn't exist the bot will spawn a boss
		 */
		if (!randomOpponent) {
			// spawn boss
			opponent = await spawnDGBoss(userRank);
			// embed.setDescription("We could not find other players in your rank. Please try again later");
			// context.channel?.sendMessage(embed);
			// return;
		} else {
			const opponentUser = await getRPGUser({ user_tag: randomOpponent.user_tag }, { cached: true });
			if (!opponentUser) {
				loggers.info("dungeon.v2.battle.dungeonBattle: opponent user not found: " + 
                randomOpponent);
				context.channel?.sendMessage("We could not prepare your opponent. Please contact support.");
				return;
			}
			opponent = await prepareTeamForBattle({
				team: randomOpponent.team as TeamProps,
				user_id: opponentUser.id,
				id: randomOpponent.user_tag,
				canAddGuildStats: false,
				isDungeon: true,
				capCharacterMaxLevel: true
			});
			if (!opponent) {
				loggers.info("dungeon.v2.battle.dungeonBattle: failed to create opponent team: " + 
                randomOpponent);
				await updateDGTeam(opponentUser.user_tag, {
					team: {
						...randomOpponent.team,
						metadata: []
					},
					metadata: {
						...randomOpponent.metadata,
						isValid: false
					}
				});
				opponent = await spawnDGBoss(userRank);
			} else {
				opponent.name = `Team ${randomOpponent.username}`;
				opponentTeamName = `${opponent.name} ${emojiMap(randomOpponent.rank || "duke")}`;
				opponent.username = randomOpponent.username;
				opponent = dedupItems(opponent);
			}
		}

		if (!playerStats || !opponent) {
			context.channel?.sendMessage("We could not prepare your battle. Please contact support.");
			return;
		}
		playerStats.name = `Team ${author.username}`;
		const playerTeamName = `${playerStats.name} ${emojiMap(userRank?.rank || "duke")}`;
		const _effectiveness = addTeamEffectiveness({
			cards: playerStats.cards,
			enemyCards: opponent.cards,
			playerStats: playerStats.totalStats,
			opponentStats: opponent.totalStats 
		});
		playerStats.totalStats = _effectiveness.playerStats;
		opponent.totalStats = _effectiveness.opponentStats;
		inBattle = await getCooldown(author.id, cdKey);
		if (inBattle) return;
		setCooldown(author.id, cdKey, 60 * 5);
		const result = await simulateBattle({
			context,
			playerStats,
			enemyStats: opponent,
			title: `__Ranked Battle Challenge ${playerTeamName} vs ${opponentTeamName || opponent.name}__`,
			isRaid: false,
			options: { hideVisualBattle: false }
		});
		clearCooldown(author.id, cdKey);
		if (!result) {
			context.channel?.sendMessage(
				"Unable to process battle, please try again later"
			);
			return;
		}
		if (result.isForfeit) {
			result.isVictory = false;
		}
		// update user dg mana
		// await refetchAndUpdateUserMana(author.id, DUNGEON_MANA_PER_BATTLE, BATTLE_TYPES.DUNGEON);
        
		await transaction(async (trx) => {
			try {
				loggers.info("dungeon.v2.battle.dungeonBattle: transaction started...");
				const updatedObj = await trx.raw(
					`update users set dungeon_mana = dungeon_mana - ${DUNGEON_MANA_PER_BATTLE}
                    where user_tag = '${author.id}' and is_banned = false returning *`
				).then((res) => res.rows[0]);
				if (!updatedObj) {
					embed.setTitle(DEFAULT_ERROR_TITLE)
						.setDescription("You do not have enough mana to battle!");

					context.channel?.sendMessage(embed);
					return trx.rollback();
				}
				loggers.info("Dungeon mana update successful for uid: " + author.id, updatedObj);
				loggers.info("dungeon.v2.battle.dungeonBattle: battle outcome processing started... uid " + author.id);
				if (!opponent) {
					result.isBot = true;
				}
				processBattleOutcome({
					result,
					author,
					client,
					channel: context.channel,
					opponentId: opponent?.id || "No id",
					opponentUsername: opponent?.username || opponent?.name || "No Name"
				});
				loggers.info("battle outcome proessed for user: " + author.id);
				return trx.commit();
			} catch (err) {
				loggers.error("dungeon.v2.battle.dungeonBattle: transaction FAILED", err);
				return trx.rollback();
			}
		});
		return;
	} catch (err) {
		loggers.error("dungon.v2.battle.dungeonBattle: ERROR", err);
		return;
	}
};