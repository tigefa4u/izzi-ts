import { RPGBattleCardDetailProps } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { getCardForBattle } from "api/controllers/CollectionInfoController";
import { getGuildMember } from "api/controllers/GuildMembersController";
import { getGuild } from "api/controllers/GuildsController";
import { getStageForBattle } from "api/controllers/StagesController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { getZoneByLocationId } from "api/controllers/ZonesController";
import { createEmbed } from "commons/embeds";
import { preparePlayerBase } from "helpers";
import { addEffectiveness, preparePlayerStats } from "helpers/adventure";
import { refetchAndUpdateUserMana, validateFiveMinuteTimer } from "helpers/battle";
import { DEFAULT_ERROR_TITLE, MANA_PER_BATTLE } from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { simulateBattle } from "./battle/battle";
import { processBattleResult } from "./battle/battleResult";
import * as battlePerChannel from "./battle/battlesPerChannelState";

export const battle = async ({ context, args, options, client }: BaseProps) => {
	try {
		const battlesInChannel = battlePerChannel.validateBattlesInChannel(
			context.channel?.id || ""
		);
		if (battlesInChannel === undefined) return;
		const author = options.author;
		let inBattle = await getCooldown(author.id, "mana-battle");
		if (inBattle) {
			await validateFiveMinuteTimer({
				timestamp: inBattle.timestamp,
				key: `cooldown::mana-battle-${author.id}` 
			});
			context.channel?.sendMessage(
				"Your battle is still in progress. " +
          "(If you have completed your battle and are still seeing this, please try again in 1 minute)"
			);
			return;
		}
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) return;
		if (!user.selected_card_id) {
			context.channel?.sendMessage(
				"Please select a card to fight alongside you!"
			);
			return;
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);

		if (user.mana < MANA_PER_BATTLE) {
			embed.setDescription(
				`You do not have enough mana to proceed! **[${user.mana} / ${MANA_PER_BATTLE}]** Mana`
			);
			context.channel?.sendMessage(embed);
			return;
		}

		const zone = await getStageForBattle({
			location_id: user.ruin,
			floor: user.floor,
		});
		if (!zone) {
			loggers.info(
				"Stage not found for zone: " + user.ruin + " floor: " + user.floor
			);
			const zoneData = await getZoneByLocationId({ location_id: user.ruin });
			if (zoneData) {
				const body = {
					max_floor: zoneData.max_floor,
					floor: zoneData.max_floor,
				};
				if (user.ruin === user.max_ruin) {
					Object.assign(body, { max_ruin_floor: zoneData.max_floor });
				}
				await updateRPGUser({ user_tag: user.user_tag }, body);
			}
			context.channel?.sendMessage(
				"Please check the number of zones available. " +
          "(This is a bug, please report it on our support server) (Hint: Please type ``bt`` again)"
			);
			return;
		}

		const card = await getCardForBattle({
			id: user.selected_card_id,
			user_id: user.id,
			user_tag: user.user_tag
		});
		if (!card) return;

		const battleCardDetails: RPGBattleCardDetailProps = {
			selected_card_id: user.selected_card_id,
			floor: user.floor,
			ruin: user.ruin,
			max_ruin: user.max_ruin,
			max_floor: user.max_floor,
			max_ruin_floor: zone.max_floor,
			...card,
		};
		const enemyCard = {
			character_id: zone.character_id,
			name: zone.name,
			rank: zone.rank,
			stats: zone.stats,
			filepath: zone.filepath,
			series: zone.series,
			abilityname: zone.abilityname,
			abilitydescription: zone.abilitydescription,
			character_level: zone.level,
			type: zone.type,
			id: 0,
			user_id: 0,
			is_on_market: false,
			is_item: false,
			is_favorite: false,
			item_id: 0,
			exp: 0,
			r_exp: 0,
			rank_id: 0,
			created_at: "",
			updated_at: "",
			souls: 0,
		} as CollectionCardInfoProps;
		if (zone.metadata?.assets) {
			enemyCard.filepath = zone.metadata.assets[zone.rank].small.filepath;
		}
		if (args && (args.shift() || "").toLowerCase() === "all") {
			const inCd = await getCooldown(author.id, "mana-battle");
			if (inCd) return;
			if (
				battleCardDetails.floor === user.max_floor &&
		battleCardDetails.ruin === battleCardDetails.max_ruin
			) {
				const errorEmbed = createEmbed(author, client);
				errorEmbed
					.setTitle("Error :no_entry:")
					.setDescription("You must battle this floor atleast once!");

				context.channel?.sendMessage(errorEmbed);
				return;
			}
			if (user.mana < MANA_PER_BATTLE) {
				const newErrorEmbed = createEmbed(author, client);
				newErrorEmbed
					.setColor("#f51d11")
					.setTitle("Error :no_entry:")
					.setDescription(
						`You do not have enough mana to proceed! **[${user.mana} / ${MANA_PER_BATTLE}]** Mana`
					);
				context.channel?.sendMessage(newErrorEmbed);
				return;
			}
			await setCooldown(author.id, "mana-battle", 1);
			const multiplier = Math.floor(user.mana / MANA_PER_BATTLE) || 1;
			processBattleResult({
				result: { isVictory: true },
				card: battleCardDetails,
				enemyCard,
				author,
				multiplier: multiplier,
				channel: context.channel,
			});
			user.mana = user.mana - (multiplier * MANA_PER_BATTLE);
			await Promise.all([
				updateRPGUser({ user_tag: user.user_tag }, { mana: user.mana }),
				clearCooldown(author.id, "mana-battle"),
			]);
			return;
		}

		// loggers.info(
		// 	"Prepared Player and Enemy Battle Card: " +
		// "Player: " +
		// JSON.stringify(battleCardDetails) +
		// " Boss: " +
		// JSON.stringify(enemyCard)
		// );

		let guildStats;
		const guildMember = await getGuildMember({ user_id: user.id });
		if (guildMember) {
			const guild = await getGuild({ id: guildMember.guild_id });
			if (guild) {
				guildStats = guild.guild_stats;
			}
		}

		const promises = [
			preparePlayerStats({
				stats: card.stats,
				characterLevel: card.character_level,
				rank: card.rank,
				guildStats,
			}),
			preparePlayerStats({
				stats: zone.stats,
				characterLevel: enemyCard.character_level,
				rank: enemyCard.rank,
			}),
		];

		const [ player, opponent ] = await Promise.all(promises);
		const [ _playerStats, _enemyStats ] = await Promise.all([
			addEffectiveness({
				playerType: card.type,
				enemyType: enemyCard.type,
				playerStats: player.playerStats,
			}),
			addEffectiveness({
				playerType: enemyCard.type,
				enemyType: card.type,
				playerStats: opponent.playerStats,
			}),
		]);
		const playerStats = _playerStats;
		const enemyStats = _enemyStats;
		card.stats = player.baseStats;
		const playerBase = preparePlayerBase({
			id: user.user_tag,
			playerStats,
			name: `${author.username}'s ${titleCase(card.name)}`,
			card,
		});
		enemyCard.stats = opponent.baseStats;
		const enemyBase = preparePlayerBase({
			id: `zoneboss${user.ruin}${user.floor}`,
			playerStats: enemyStats,
			name: `Enemy's ${titleCase(enemyCard.name)}`,
			card: enemyCard,
		});

		inBattle = await getCooldown(author.id, "mana-battle");
		if (inBattle) return;
		setCooldown(author.id, "mana-battle", 60 * 5);

		const result = await simulateBattle({
			context,
			playerStats: playerBase,
			enemyStats: enemyBase,
			title: `__Challenging Floor ${user.ruin}-${user.floor}__`,
		});
		clearCooldown(author.id, "mana-battle");
		refetchAndUpdateUserMana(author.id);
		if (!result) {
			context.channel?.sendMessage("Unable to process your battle");
			return;
		}
		if (result.isForfeit) return;
		processBattleResult({
			result: { isVictory: result.isVictory || false },
			card: battleCardDetails,
			enemyCard,
			author,
			multiplier: 1,
			channel: context.channel,
		});
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.adventure.index.battle(): something went wrong",
			err
		);
		return;
	}
};
