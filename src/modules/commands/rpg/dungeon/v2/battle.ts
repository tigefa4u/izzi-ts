import { BaseProps } from "@customTypes/command";
import { TeamProps } from "@customTypes/teams";
import { UserRankProps } from "@customTypes/userRanks";
import { getDGTeam, getRandomDGOpponent, updateDGTeam } from "api/controllers/DungeonsController";
import { createUserRank, getUserRank } from "api/controllers/UserRanksController";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { emojiMap } from "emojis";
import { addTeamEffectiveness } from "helpers/adventure";
import { refetchAndUpdateUserMana, validateFiveMinuteTimer } from "helpers/battle";
import {
	BATTLE_TYPES, DEFAULT_ERROR_TITLE, DUNGEON_DEFAULTS, DUNGEON_MANA_PER_BATTLE, DUNGEON_MIN_LEVEL 
} from "helpers/constants";
import { prepareSkewedCollectionsForBattle, prepareTeamForBattle } from "helpers/teams";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { prepareDungeonBoss } from "..";
import { simulateBattle } from "../../adventure/battle/battle";
import * as battlesInChannel from "../../adventure/battle/battlesPerChannelState";
import { processBattleOutcome } from "./rewards";

const spawnDGBoss = async (userRank?: UserRankProps) => {
	const dungeonBoss = await prepareDungeonBoss(userRank);
	const enemyStats = await prepareSkewedCollectionsForBattle({
		collections: dungeonBoss,
		id: "Dungeon Boss",
		name: "XeneX's Dungeon Boss"
	});
	enemyStats.isBot = true;
	return enemyStats;
};

export const dungeonBattle = async ({ context, options, client }: BaseProps) => {
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
		const [ dgTeam, _userRank ] = await Promise.all([
			getDGTeam(author.id),
			getUserRank({ user_tag: author.id })
		]);
		if (!dgTeam?.team) {
			embed.setDescription(`Summoner **${author.username}**, You do not have a DG Team! Create a DG Team ` +
            "using ``iz dg create <name>``");

			context.channel?.sendMessage(embed);
			return;
		} else if (!dgTeam.metadata.isValid) {
			embed.setDescription(`Summoner **${author.username}**, Your DG Team is not ready to battle! ` +
            "Set a card into your DG Team " +
            "using ``iz dg set <#ID> <position #>``");

			context.channel?.sendMessage(embed);
			return; 
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

		const playerStats = await prepareTeamForBattle({
			team: dgTeam.team as TeamProps,
			user_id: user.id,
			id: author.id,
			canAddGuildStats: false
		});
		if (!playerStats) {
			embed.setDescription("You do not have a valid DG Team, Please reset your team using ``iz dg reset``");

			context.channel?.sendMessage(embed);
			return;
		}
		let opponent, opponentTeanName = "";
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
		} else {
			const opponentUser = await getRPGUser({ user_tag: randomOpponent.user_tag }, { cached: true });
			if (!opponentUser) {
				loggers.info("dungeon.v2.battle.dungeonBattle: opponent user not found: " + 
                JSON.stringify(randomOpponent));
				context.channel?.sendMessage("We could not prepare your opponent. Please contact support.");
				return;
			}
			opponent = await prepareTeamForBattle({
				team: randomOpponent.team as TeamProps,
				user_id: opponentUser.id,
				id: randomOpponent.user_tag,
				canAddGuildStats: false
			});
			if (!opponent) {
				loggers.info("dungeon.v2.battle.dungeonBattle: failed to create opponent team: " + 
                JSON.stringify(randomOpponent));
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
				opponentTeanName = `${randomOpponent.team.name} ${emojiMap(randomOpponent.rank || "duke")}`;
				opponent.username = randomOpponent.username;
			}
		}

		if (!playerStats || !opponent) {
			context.channel?.sendMessage("We could not prepare your battle. Please contact support.");
			return;
		}
		const playerTeamName = `${dgTeam.team.name} ${emojiMap(userRank?.rank || "duke")}`;
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
			title: `__Ranked Battle Challenge ${playerTeamName} vs ${opponentTeanName || opponent.name}__`,
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
		await refetchAndUpdateUserMana(author.id, DUNGEON_MANA_PER_BATTLE, BATTLE_TYPES.DUNGEON);
		processBattleOutcome({
			result,
			author,
			userRank,
			client,
			channel: context.channel,
			opponentId: opponent.id,
			opponentUsername: opponent.username || opponent.name
		});
		return;
	} catch (err) {
		loggers.error("dungon.v2.battle.dungeonBattle: ERROR", err);
		return;
	}
};