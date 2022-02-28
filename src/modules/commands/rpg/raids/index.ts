import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { RaidLootProps, RaidProps, RaidStatsProps } from "@customTypes/raids";
import Cache from "cache";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { prepareHPBar } from "helpers/adventure";
import { processHpBar, relativeDiff } from "helpers/battle";
import { MAX_ENERGY_PER_RAID } from "helpers/constants";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { titleCase } from "title-case";
import { battleRaidBoss } from "./actions/battle";
import { showEnergy } from "./actions/energy";
import { inviteToRaid } from "./actions/invite";
import { joinRaid } from "./actions/join";
import { kickmember } from "./actions/kick";
import { leaveLobby } from "./actions/leave";
import { raidLobbies } from "./actions/lobbies";
import { raidParty } from "./actions/party";
import { memberReady } from "./actions/ready";
import { spawnRaid } from "./actions/spawn";
import { startRaid } from "./actions/start";
import { toggleLobbyType } from "./actions/toggleLobbyType";
import { viewRaid } from "./actions/view";
import { voteKickMember } from "./actions/votekick";
import { subcommands } from "./subcommands";

export const raidActions = async ({
	context,
	client,
	options,
	args,
	command,
}: BaseProps) => {
	try {
		const disableRaids = await Cache.get("disable-raids");
		if (disableRaids) {
			context.channel?.sendMessage(
				"Command disabled, There could be an on going event. Use ``help event`` for more info"
			);
			return;
		}
		const subcommand = filterSubCommands(
			args.shift() || "lobbies",
			subcommands
		);
		const params = {
			context,
			client,
			args,
			options,
			command,
			isEvent: false,
		};
		if (subcommand === "spawn") {
			spawnRaid(params);
		} else if (subcommand === "lobbies") {
			raidLobbies(params);
		} else if (subcommand === "view") {
			viewRaid(params);
		} else if (subcommand === "party") {
			raidParty(params);
		} else if (subcommand === "makepublic") {
			toggleLobbyType({
				...params,
				isPrivate: false,
			});
		} else if (subcommand === "makeprivate") {
			toggleLobbyType({
				...params,
				isPrivate: true,
			});
		} else if (subcommand === "energy") {
			showEnergy(params);
		} else if (subcommand === "ready") {
			memberReady(params);
		} else if (subcommand === "leave") {
			leaveLobby(params);
		} else if (subcommand === "votekick") {
			voteKickMember(params);
		} else if (subcommand === "kick") {
			kickmember(params);
		} else if (subcommand === "start") {
			startRaid(params);
		} else if (subcommand === "join") {
			joinRaid(params);
		} else if (subcommand === "invite") {
			inviteToRaid(params);
		} else if (subcommand === "battle") {
			battleRaidBoss(params);
		}
	} catch (err) {
		loggers.error(
			"modules.commands.rpg.raids.raidActions(): something went wrong",
			err
		);
		return;
	}
};

export function prepareRaidBossEmbedDesc(raid: RaidProps, isEvent = false) {
	const stats = raid.stats;
	const loot = raid.loot;
	const boss = raid.raid_boss;
	const damageDiff = relativeDiff(
		stats.remaining_strength,
		stats.original_strength,
		8
	);
	const overAllStats = prepareFakeHp(stats);
	const fakeHp = processHpBar(overAllStats, damageDiff).health;

	const desc = `**Level ${stats.battle_stats.boss_level} ${
		isEvent ? "Event" : "Raid"
	} Boss**\n**${stats.remaining_strength} / ${stats.original_strength} ${
		emoji.hp
	}**\n${fakeHp.map((i) => i).join("")}\n\n**Element Type:** ${boss
		.map((c) => emojiMap(c.type))
		.join("")}\n**Boss Ability:** ${boss
		.map((c) => emojiMap(c.abilityname))
		.join(" ")}\n**Total HP:** ${
		stats.battle_stats.stats.strength
	}\n**Total ATK:** ${stats.battle_stats.stats.vitality}\n**Total DEF:** ${
		stats.battle_stats.stats.defense
	}\n**Total SPD:** ${stats.battle_stats.stats.dexterity}\n**Total INT:** ${
		stats.battle_stats.stats.intelligence
	}\n\n**Power Level:** ${stats.battle_stats.power_level}\n\n${prepareLoot(
		boss,
		loot,
		isEvent
	)}`;

	return desc;
}

function prepareFakeHp(stats: RaidStatsProps) {
	return {
		health: prepareHPBar(8),
		strength: stats.remaining_strength,
	};
}

function prepareLoot(
	boss: CollectionCardInfoProps[],
	loot: RaidLootProps,
	isEvent = false
) {
	const desc = `**__${isEvent ? "Event" : "Raid"} Rewards [For Everyone]__**\n${
		loot.gold
	} Gold ${emoji.gold}\n${boss
		.map((b) => {
			let desc = "";

			if (isEvent) {
				desc =
          `__${loot.drop.event?.shard}__ Shards ${emoji.shard}` +
          `\n__${loot.drop.event?.orbs}__ Orbs ${emoji.blueorb}`;
			} else {
				desc =
          loot.drop.default
          	?.map(
          		(d) =>
          			`__${d.number}x__ ${titleCase(d.rank)} of **${titleCase(
          				b.name
          			)}**`
          	)
          	.join("\n") || "";
			}

			return desc;
		})
		.join(
			"\n"
		)}\n\n**__Total Possible Drop Loot Rewards [Divided Among Lobby Members]__**\n__${
		loot.extraGold
	}__ Gold ${emoji.gold}\n${
		loot.rare
			? boss.map((b) =>
				loot.rare?.map(
					(r) =>
						`__${r.number}x__ ${titleCase(r.rank)} of **${titleCase(
							b.name
						)}** (At ${r.rate}% drop rate)`
				)
			).join("\n")
			: ""
	}`;

	return desc;
}

export function prepareInitialLobbyMember(
	user_id: number,
	tag: string,
	username: string,
	level: number,
	is_leader: boolean
) {
	return {
		[user_id]: {
			user_tag: tag,
			user_id,
			username,
			level,
			energy: MAX_ENERGY_PER_RAID,
			total_energy: MAX_ENERGY_PER_RAID,
			total_damage: 0,
			total_attack: 0,
			votes: 0,
			timestamp: new Date().getTime(),
			is_leader: is_leader,
		},
	};
}

export function prepareRaidTimer(currentRaid: RaidProps) {
	const timer = new Date(currentRaid.stats.timestamp);
	const remainingTime = (timer.valueOf() - new Date().valueOf()) / 1000 / 60;
	const remainingHours = Math.floor(remainingTime / 60);
	const remainingMinutes = Math.floor(remainingTime % 60);
	const title = `Timer [${
		remainingHours > 0 ? `${remainingHours}h` : ""
	} ${remainingMinutes > 0 ? `${remainingMinutes}m` : ""} | ID: ${
		currentRaid.id
	}]`;

	return title;
}