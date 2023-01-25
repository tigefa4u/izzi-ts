import { RPGBattleCardDetailProps } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { getCardForBattle } from "api/controllers/CollectionInfoController";
import { getGuildMember } from "api/controllers/GuildMembersController";
import { getGuild } from "api/controllers/GuildsController";
import { getStageForBattle } from "api/controllers/StagesController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { getZoneByLocationId } from "api/controllers/ZonesController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { preparePlayerBase } from "helpers";
import { addEffectiveness, preparePlayerStats } from "helpers/adventure";
import {
	refetchAndUpdateUserMana,
	validateFiveMinuteTimer,
} from "helpers/battle";
import {
	DEFAULT_ERROR_TITLE,
	DEFAULT_STARTER_GUIDE_TITLE,
	HIDE_VISUAL_BATTLE_ARG,
	MANA_PER_BATTLE,
} from "helpers/constants";
import loggers from "loggers";
import { clearCooldown, getCooldown, setCooldown } from "modules/cooldowns";
import { titleCase } from "title-case";
import { battleConfirmationInteraction } from "utility/ButtonInteractions";
import { simulateBattle } from "./battle/battle";
import * as battlePerChannel from "./battle/battlesPerChannelState";
import { processBattleTransaction } from "./battle/battleTransaction";

export const startBattle = async (params: BaseProps) => {
	return battleConfirmationInteraction({
		...params,
		invokeFunc: battle
	});
};

const battle = async ({ context, args, options, client }: BaseProps) => {
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
				key: `cooldown::mana-battle-${author.id}`,
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
			user_tag: user.user_tag,
		});
		if (!card) {
			context.channel?.sendMessage("Please select a card to fight alongside you!");
			return;
		}

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
			is_on_cooldown: false,
			is_tradable: true
		} as CollectionCardInfoProps;
		if (zone.metadata?.assets) {
			enemyCard.filepath = zone.metadata.assets.small.filepath;
		}
		const paramArgs = (args.shift() || "").toLowerCase();
		if (args && paramArgs === "all") {
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
			processBattleTransaction({
				result: { isVictory: true },
				card: battleCardDetails,
				enemyCard,
				author,
				multiplier: multiplier,
				channel: context.channel,
				user
			});
			await clearCooldown(author.id, "mana-battle");
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
		const enemyStats = addEffectiveness({
			playerType: enemyCard.type,
			enemyType: card.type,
			playerStats: opponent.playerStats,
		});
		const playerStats = addEffectiveness({
			playerType: card.type,
			enemyType: enemyCard.type,
			playerStats: player.playerStats,
		});
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
			isRaid: false,
			options: { hideVisualBattle: paramArgs === HIDE_VISUAL_BATTLE_ARG ? true : false, },
		});
		clearCooldown(author.id, "mana-battle");
		if (!result) {
			context.channel?.sendMessage("Unable to process your battle");
			return;
		}
		if (result.isForfeit) {
			await refetchAndUpdateUserMana(author.id);
			return;
		}
		processBattleTransaction({
			result: {
				isVictory: result.isVictory || false,
				simulation: result.simulation,
				attachments: result.attachments
			},
			card: battleCardDetails,
			enemyCard,
			author,
			multiplier: 1,
			channel: context.channel,
			user
		});

		const key = "guide::" + author.id;
		const starterGuide = await Cache.get(key);
		if (starterGuide) {
			const guideEmbed = createEmbed(author, client)
				.setTitle(DEFAULT_STARTER_GUIDE_TITLE)
				.setDescription(
					`Yay! Well done Summoner **${author.username}**!\n\nYou have completed ` +
            "your first floor challenge. On defeating the floor boss you will receive gold and " +
            "experience to advance further and level up.\n" +
            "Your card will also receive exp to level up and become more powerful.\n\n" +
            "You can advance to the next floor using ``@izzi fl n`` or ``@izzi fl <number>``"
				)
				.setFooter({
					iconURL: author.displayAvatarURL(),
					text: "Guide will automatically expire in 10 mins.",
				});
			context.channel?.sendMessage(guideEmbed);
		}
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.adventure.index.battle: ERROR",
			err
		);
		return;
	}
};
