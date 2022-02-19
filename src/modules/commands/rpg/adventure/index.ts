import { BattleStats } from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { getCardForBattle } from "api/controllers/CollectionInfoController";
import { getStageForBattle } from "api/controllers/StagesController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { getZoneByLocationId } from "api/controllers/ZonesController";
import { createEmbed } from "commons/embeds";
import { preparePlayerBase } from "helpers";
import { addEffectiveness, preparePlayerStats } from "helpers/adventure";
import { DEFAULT_ERROR_TITLE, MANA_PER_BATTLE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { simulateBattle } from "./battle";

export const battle = async ({ context, args, options, client }: BaseProps) => {
	try {
		const author = options.author;
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
		});
		if (!card) return;

		const battleCardDetails = {
			selected_card_id: user.selected_card_id,
			itemDetails: {
				name: card.itemname,
				stats: card.itemStats,
			},
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
		// loggers.info(
		// 	"Prepared Player and Enemy Battle Card: " +
		// "Player: " +
		// JSON.stringify(battleCardDetails) +
		// " Boss: " +
		// JSON.stringify(enemyCard)
		// );

		const promises = [
			preparePlayerStats({
				stats: card.stats,
				characterLevel: card.character_level,
				rank: card.rank,
			}),
			preparePlayerStats({
				stats: zone.stats,
				characterLevel: enemyCard.character_level,
				rank: enemyCard.rank,
			}),
		];

		let [ playerStats, enemyStats ] = await Promise.all(promises);
		const [ _playerStats, _enemyStats ] = await Promise.all([
			addEffectiveness({
				playerType: card.type,
				enemyType: enemyCard.type,
				playerStats,
			}),
			addEffectiveness({
				playerType: enemyCard.type,
				enemyType: card.type,
				playerStats: enemyStats,
			}),
		]);
		playerStats = _playerStats;
		enemyStats = _enemyStats;
		const playerBase = preparePlayerBase({
			id: user.user_tag,
			playerStats,
			name: `${author.username}'s ${titleCase(card.name)}`,
			card,
		});
		const enemyBase = preparePlayerBase({
			id: `zoneboss${user.ruin}${user.floor}`,
			playerStats: enemyStats,
			name: `Enemy's ${titleCase(enemyCard.name)}`,
			card: enemyCard,
		});
		user.mana = user.mana - MANA_PER_BATTLE;
		await updateRPGUser({ user_tag: user.user_tag }, { mana: user.mana });
		simulateBattle({
			context,
			playerStats: playerBase,
			enemyStats: enemyBase,
			title: `__Challenging Floor ${user.ruin}-${user.floor}__`,
		});
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.adventure.index.battle(): something went wrong",
			err
		);
		return;
	}
};
