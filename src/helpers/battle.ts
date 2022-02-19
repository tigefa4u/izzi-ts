import { AuthorProps, ChannelProp } from "@customTypes";
import {
	BattleStats,
	PrepareBattleDescriptionProps,
} from "@customTypes/adventure";
import { createEmbed } from "commons/embeds";
import { Client, Message, MessageEmbed } from "discord.js";
import emoji from "emojis/emoji";
import { randomNumber } from "helpers";
import gt from "lodash/gt";
import { clone } from "utility";
import { prepareBattleDesc } from "./adventure";

export const compareDexterity = (x1: number, x2: number) => {
	return gt(x1, x2);
};

export const simulateBattleDescription = ({
	playerStats,
	enemyStats,
	description,
	embed,
	message,
}: PrepareBattleDescriptionProps & {
  embed: MessageEmbed;
  message: Message;
}) => {
	const desc = prepareBattleDesc({
		playerStats,
		enemyStats,
		description,
		totalDamage: 0,
	});
	if (!embed || !embed.title || !embed.description)
		throw new Error("Embed required to edit battle!");
	const newEmbed = recreateBattleEmbed(embed.title, embed.description);
	if (!message) throw new Error("Message Object required to edit battle!");
	newEmbed.setDescription(desc);

	if (message.editable) {
		message
			.editMessage(newEmbed, { reattachOnEdit: true });

		return { edited: true };
	}

	return false;
};

function recreateBattleEmbed(title: string, description: string) {
	return createEmbed()
		.setTitle(title)
		.setDescription(description)
		.setImage("attachment://battle.jpg");
}

export const getPlayerDamageDealt = (
	playerTotalStats: BattleStats["totalStats"],
	enemyTotalStats: BattleStats["totalStats"]
) => {
	// let modifiers = playercrit * playeraccuracy * effectiveness * random(0.85, 1);
	// (((((2*2)/5) + 2) * vitality * (vitality/enemyDefense))/50 + 2) * modifiers; // wont work damage too low
	// (1+(a.atk*0.01)) * a.atk/Math.max(1,b.def) * modifiers
	// (atk**2/(atk + def)) * modifiers (currently in use)
	const { vitality, isCriticalHit, effective, critDamage } = playerTotalStats;
	const { defense } = enemyTotalStats;
	const modifiers =
    (isCriticalHit ? (critDamage > 1 ? critDamage : 1.5) : 1) *
    // accuracy *
    (effective ? effective : 1) *
    randomNumber(0.85, 1, true);
	let atk = clone(vitality);
	let def = clone(defense);
	atk = atk + Math.floor(playerTotalStats.intelligence * (6 / 100));
	def = def + Math.floor(enemyTotalStats.intelligence * (10 / 100));
	// let damage = Math.round(
	//   0.5 * vitality * (vitality / defense) * modifiers + 1
	// );
	// testing
	// let damage = Math.floor((1 + (vitality * 0.01)) * (vitality/Math.max(1, defense)) * modifiers * 100);
	const damage = Math.floor((atk ** 2 / (atk + def)) * modifiers);
	// if (damage <= 0) damage = randomNumber(300, 500);
	return damage;
};

export const relativeDiff = (
	updatedHp: number,
	originalHp: number,
	customHp = 12
) => Math.ceil(customHp * (updatedHp / originalHp));

export const processHpBar = (player: BattleStats, damageDiff: number) => {
	const mediumHealthRatio = player.totalStats.health.length * (50 / 100);
	const lowHealthRatio = player.totalStats.health.length * (30 / 100);
	let strCheck = player.totalStats.strength;
	if (strCheck < 0) strCheck = 0;
	player.totalStats.health.map((_, i) => {
		if (damageDiff <= player.totalStats.health.length - 1 && i <= damageDiff) {
			if (i === player.totalStats.health.length - 1)
				player.totalStats.health[player.totalStats.health.length - 1] =
          emoji.g3;
			else {
				if (i === 0) player.totalStats.health[0] = emoji.g1;
				else player.totalStats.health[i] = emoji.g2;
			}
		}
		if (damageDiff < mediumHealthRatio && i <= damageDiff) {
			if (i === 0) player.totalStats.health[0] = emoji.y1;
			else player.totalStats.health[i] = emoji.y2;
		}
		if (damageDiff < lowHealthRatio && i <= damageDiff) {
			if (i === 0) player.totalStats.health[0] = emoji.r1;
			else player.totalStats.health[i] = emoji.r2;
		}
		if (strCheck > 0 && damageDiff <= 0) {
			player.totalStats.health[0] = emoji.r1;
		}
		if (i > damageDiff || damageDiff === 0) {
			player.totalStats.health[i] = emoji.e2;
			if (i === 0) player.totalStats.health[0] = emoji.e1;
			if (i === player.totalStats.health.length - 1)
				player.totalStats.health[player.totalStats.health.length - 1] =
          emoji.e3;
		}
	});
	player.totalStats.strength = strCheck;
	return player;
};

export const sendBattleStatusEmbed = (
	author: AuthorProps,
	client: Client,
	channel: ChannelProp,
	desc = "Better luck next time",
	title = `Defeated ${emoji.cry}`
) => {
	const embed = createEmbed(author, client)
		.setTitle(title)
		.setDescription(desc);

	channel?.sendMessage(embed);
	return;
};
