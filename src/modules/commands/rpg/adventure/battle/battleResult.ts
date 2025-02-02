import { AuthorProps, ChannelProp } from "@customTypes";
import {
	BattleStats,
	RPGBattleCardDetailProps,
	Simulation,
} from "@customTypes/adventure";
import { CustomButtonInteractionParams } from "@customTypes/button";
import {
	CollectionCardInfoProps,
	CollectionCreateProps,
} from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { UserProps } from "@customTypes/users";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import {
	createCollection,
	updateCollection,
} from "api/controllers/CollectionsController";
import { getPowerLevelByRank } from "api/controllers/PowerLevelController";
import { getRPGUser, updateRPGUser } from "api/controllers/UsersController";
import { createOrUpdateZoneBackup } from "api/controllers/ZonesController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { randomNumber } from "helpers";
import {
	BASE_XP,
	CONSOLE_BUTTONS,
	LOW_LEVEL_THRESHOLD,
	MAX_MANA_GAIN,
	STARTER_CARD_EXP,
	STARTER_CARD_LEVEL,
	STARTER_CARD_R_EXP,
	USER_XP_GAIN_PER_BATTLE,
	XP_GAIN_EXPONENT,
} from "helpers/constants/constants";
import { ranksMeta } from "helpers/constants/rankConstants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { customButtonInteraction } from "utility/ButtonInteractions";
import { startBattle } from "..";
import { floor } from "../../zoneAndFloor/floor";
import { zone } from "../../zoneAndFloor/zone";
import { viewBattleLogs } from "./viewBattleLogs";

export const handleButtonActions = async ({
	user_tag,
	client,
	channel,
	id,
	simulation,
	attachments,
}: CustomButtonInteractionParams & {
  simulation?: Simulation;
  attachments?: (CollectionCardInfoProps | undefined)[];
}) => {
	const author = await client.users.fetch(user_tag);
	const options = {
		context: { channel } as BaseProps["context"],
		client,
		options: { author },
		args: [ "bt" ],
	};
	switch (id) {
		case CONSOLE_BUTTONS.NEXT_FLOOR.id: {
			options.args = [ "n" ];
			floor(options);
			return;
		}
		case CONSOLE_BUTTONS.FLOOR_BT.id: {
			startBattle(options);
			return;
		}
		case CONSOLE_BUTTONS.NEXT_ZONE.id: {
			options.args = [ "n" ];
			zone(options);
			return;
		}
		case CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id: {
			if (simulation && attachments) {
				viewBattleLogs({
					simulation,
					authorId: author.id,
					channel,
					attachments,
				});
			}
			return;
		}
	}
	return;
};

type P = {
  result: {
    isVictory: boolean;
    simulation?: Simulation;
    attachments?: (CollectionCardInfoProps | undefined)[];
  };
  card: RPGBattleCardDetailProps;
  enemyCard: CollectionCardInfoProps;
  author: AuthorProps;
  multiplier: number;
  channel: ChannelProp;
};
export const processBattleResult = async ({
	result,
	card,
	enemyCard,
	author,
	multiplier,
	channel,
}: P) => {
	try {
		const user = await getRPGUser({ user_tag: author.id });
		if (!user) {
			throw new Error(
				"Unable to process RPG rewards, USER NOT FOUND ID: " + author.id
			);
		}
		if (!multiplier) multiplier = 1;
		const embed = createEmbed(author)
			.setTitle(`Defeated ${emoji.cry}`)
			.setDescription("Better luck next time.");

		const menu = [
			{
				label: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.label,
				params: {
					id: CONSOLE_BUTTONS.VIEW_BATTLE_LOGS.id,
					simulation: result.simulation,
					attachments: result.attachments,
				},
			},
		];
		if (result.isVictory) {
			const resp = await processFloorWin({
				enemyCard,
				card,
				author,
				multiplier,
				channel,
			});
			if (!resp) return;
			embed
				.setTitle(`Victory ${emoji.celebration}!`)
				.setDescription(
					`You have defeated __${titleCase(enemyCard.rank)}__ **${titleCase(
						enemyCard.name
					)}** in battle!`
				)
				.addField(
					`Rewards ${emoji.moneybag}`,
					`• You have gained __${resp.userXpGain}__xp and received __${
						resp.goldReward
					}__ gold ${emoji.gold}\n• __${multiplier}x__ ${titleCase(
						resp.rankReward
					)} copy of ${titleCase(enemyCard.name)}\n**${titleCase(
						card.name
					)}** has also gained __${resp.cardXpGain}xp__ through this battle!`
				);
		} else {
			menu.push({
				label: CONSOLE_BUTTONS.FLOOR_BT.label,
				params: {
					id: CONSOLE_BUTTONS.FLOOR_BT.id,
					simulation: undefined,
					attachments: undefined,
				},
			});
		}

		const button = customButtonInteraction(
			channel,
			menu,
			author.id,
			handleButtonActions,
			() => {
				return;
			},
			false,
			10
		);

		if (button) {
			embed.setButtons(button);
		}
		channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.adventure.battleResult.processBattleResult: ERROR",
			err
		);
		return;
	}
};

async function processFloorWin({
	card,
	channel,
	enemyCard,
	multiplier,
	author,
}: Omit<P, "result">) {
	const user = await getRPGUser({ user_tag: author.id });
	if (!user) {
		throw new Error(
			"Unable to process RPG rewards, USER NOT FOUND ID: " + author.id
		);
	}
	const battleCard = await getCollectionById({
		user_id: user.id,
		id: card.selected_card_id,
	});
	if (!battleCard || battleCard.length <= 0) {
		channel?.sendMessage("This card does not belong to you");
		return;
	}
	const rankReward = "platinum";
	const rankId = ranksMeta.platinum.rank_id;
	let goldReward = randomNumber(80, 109);
	if (user.max_ruin >= 20 && user.max_ruin < 40) {
		goldReward = randomNumber(110, 150);
		// rankReward = "gold";
		// rankId = 2;
	} else if (user.max_ruin >= 40 && user.max_ruin < 100) {
		goldReward = randomNumber(160, 200);
		// rankReward = "platinum";
		// rankId = 3;
	} else if (user.max_ruin >= 100) {
		goldReward = randomNumber(210, 300);
		// rankReward = "platinum";
		// rankId = 3;
	}
	const options = {
		character_id: enemyCard.character_id,
		character_level: STARTER_CARD_LEVEL,
		user_id: user.id,
		rank: rankReward,
		rank_id: rankId,
		is_item: false,
		is_on_market: false,
		exp: STARTER_CARD_EXP,
		r_exp: STARTER_CARD_R_EXP,
		is_on_cooldown: false,
		is_tradable: true,
	};
	const bodyParams: CollectionCreateProps[] = Array(multiplier)
		.fill(options)
		.map((item) => item);

	if (user.level <= LOW_LEVEL_THRESHOLD) {
		goldReward = goldReward + 100;
	}
	goldReward = goldReward * multiplier;

	const [ _coll, _user, _updatedCard ] = await Promise.all([
		createCollection(bodyParams),
		upgradeUser(
			card,
			user,
			goldReward,
			(user.level < LOW_LEVEL_THRESHOLD
				? USER_XP_GAIN_PER_BATTLE
				: USER_XP_GAIN_PER_BATTLE - 2) * multiplier,
			author,
			channel
		),
		upgradeCard(battleCard[0], multiplier),
	]);

	return {
		userXpGain: _user.xpGain,
		cardXpGain: _updatedCard.xpGain,
		goldReward,
		rankReward,
	};
}

async function upgradeUser(
	card: RPGBattleCardDetailProps,
	user: UserProps,
	goldReward: number,
	xpGain: number,
	author: AuthorProps,
	channel: ChannelProp
) {
	let desc;
	const upgradeObject = {};
	const menu = [];
	if (card.floor == card.max_floor && card.ruin == card.max_ruin) {
		if (card.floor == card.max_ruin_floor && card.ruin == card.max_ruin) {
			desc =
        `Congratulations Summoner **${author.username}**! ${emoji.celebration} ` +
        "you have cleared this zone. " +
        `You can now proceed to **\`\`Zone ${
        	user.max_ruin + 1
        }.\`\`** You have received __750__g ${emoji.gold}`;
			user.max_ruin = card.max_ruin + 1;
			user.max_ruin_floor = 1;
			user.gold = user.gold + 750;
			await createOrUpdateZoneBackup({
				user_tag: user.user_tag,
				max_ruin: user.max_ruin,
				max_floor: 1,
			});
			menu.push({
				label: CONSOLE_BUTTONS.NEXT_ZONE.label,
				params: { id: CONSOLE_BUTTONS.NEXT_ZONE.id },
			});
			user.reached_max_ruin_at = new Date();
			Object.assign(upgradeObject, {
				max_ruin: user.max_ruin,
				max_ruin_floor: user.max_ruin_floor,
				reached_max_ruin_at: user.reached_max_ruin_at,
			});
		} else {
			desc =
        `Congratulations Summoner **${author.username}**! ${emoji.celebration} ` +
        "you have cleared this floor and " +
        `can move on to the next one.\nYou have received __500__g ${emoji.gold}`;
			user.max_ruin_floor = card.max_floor + 1;
			if (user.ruin == card.ruin) {
				user.max_floor = user.max_ruin_floor;
				Object.assign(upgradeObject, { max_floor: user.max_floor });
			}
			menu.push({
				label: CONSOLE_BUTTONS.NEXT_FLOOR.label,
				params: { id: CONSOLE_BUTTONS.NEXT_FLOOR.id },
			});
			Object.assign(upgradeObject, { max_ruin_floor: user.max_ruin_floor });
			user.gold = user.gold + 500;
			await createOrUpdateZoneBackup({
				max_ruin: user.ruin,
				max_floor: user.max_ruin_floor,
				user_tag: user.user_tag,
			});
		}
		const msg = await channel?.sendMessage(desc);
		if (msg && menu.length > 0) {
			const buttons = customButtonInteraction(
				channel,
				menu,
				author.id,
				handleButtonActions,
				() => {
					return;
				},
				false,
				10
			);
			if (buttons) {
				msg.editButton(buttons);
			}
		}
	}
	const requiredExp = user.r_exp;
	let currentExp = user.exp;
	currentExp = currentExp + xpGain;
	if (currentExp >= requiredExp) {
		user.level = user.level + 1;
		user.exp = Math.abs(currentExp - requiredExp);
		user.r_exp = user.level * 47;
		user.gold = user.gold + (user.is_married ? 2000 : 750);
		channel?.sendMessage(
			`Yay **${author.username}**! you've leveled up ${
				emoji.welldone
			}. you are now level ${user.level}\nYou have received __${
				user.is_married ? 2000 : 750
			}__ ${emoji.gold} (Hint: You receive __2000__ ${
				emoji.gold
			} if married).` +
        `\nWe've restored your mana. ${
        	user.max_mana < MAX_MANA_GAIN
        		? `Your Mana is now __${user.max_mana}__ -> __${
        			user.max_mana + 2
        		}__.`
        		: "You have already gained the maximum obtainable mana"
        }`
		);
		if (user.max_mana < MAX_MANA_GAIN) {
			user.max_mana = user.max_mana + 2;
		}
		if (user.mana < user.max_mana) {
			user.mana = user.max_mana;
		}
		Object.assign(upgradeObject, {
			mana: user.mana,
			max_mana: user.max_mana,
			r_exp: user.r_exp,
			level: user.level,
		});
	} else {
		user.exp = currentExp;
	}
	user.gold = user.gold + goldReward;
	const updateObject = {
		...upgradeObject,
		gold: user.gold,
		exp: user.exp,
	};
	await updateRPGUser({ user_tag: user.user_tag }, updateObject);
	return {
		xpGain,
		goldReward,
	};
}

export async function upgradeCard(card: CollectionCardInfoProps, multiplier = 1) {
	const powerLevel = await getPowerLevelByRank({ rank: card.rank });
	if (!powerLevel) {
		throw new Error(
			"Unable to upgrade battle card: PL not found: " + card.rank
		);
	}
	const randomXp = randomNumber(5, 8);
	const xpGain = multiplier * randomXp;
	if (card.character_level <= powerLevel.max_level && card.exp < card.r_exp) {
		card.exp = card.exp + xpGain;
	}
	if (card.exp >= card.r_exp && card.character_level < powerLevel.max_level) {
		card.character_level = card.character_level + 1;
		const diff = Math.abs(card.exp - card.r_exp);
		card.exp = diff;
		card.r_exp = Math.floor(BASE_XP * card.character_level ** XP_GAIN_EXPONENT);
	}
	const updateOptions = {
		id: card.id,
		exp: card.exp,
		r_exp: card.r_exp,
		character_level: card.character_level,
	};
	if (updateOptions.character_level >= powerLevel.max_level) {
		if (updateOptions.exp >= updateOptions.r_exp) {
			updateOptions.exp = updateOptions.r_exp;
		}
	}
	await updateCollection({ id: card.id }, updateOptions);

	return { xpGain };
}
