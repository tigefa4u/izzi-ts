import { OverallStatsProps } from "@customTypes";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { BaseProps } from "@customTypes/command";
import { RaidLootProps, RaidProps, RaidStatsProps } from "@customTypes/raids";
import Cache from "cache";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import { prepareHPBar } from "helpers/adventure";
import { processHpBar, relativeDiff } from "helpers/battle";
import { MAX_ENERGY_PER_RAID } from "helpers/constants/constants";
import { statMultiplier } from "helpers/raid";
import { filterSubCommands } from "helpers/subcommands";
import loggers from "loggers";
import { titleCase } from "title-case";
import { clone, groupByKey, isEmptyObject } from "utility";
import { battleRaidBoss } from "./actions/battle";
import { showEnergy } from "./actions/energy";
import { inviteToRaid } from "./actions/invite";
import { joinRaid } from "./actions/join";
import { kickmember } from "./actions/kick";
import { leaveLobby } from "./actions/leave";
import { raidLobbies } from "./actions/lobbies";
import { makeLeader } from "./actions/makeLeader";
import { raidParty } from "./actions/party";
import { memberReady } from "./actions/ready";
import { spawnRaid } from "./actions/spawn";
import { startRaid } from "./actions/start";
import { tagTeamBattle } from "./actions/tagBattle";
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
		} else if (subcommand === "mlead") {
			makeLeader(params);
		} else if (subcommand === "tag-battle") {
			tagTeamBattle(params);
		}
	} catch (err) {
		loggers.error("modules.commands.rpg.raids.raidActions: ERROR", err);
		return;
	}
};

export function prepareRaidBossEmbedDesc(
	raid: RaidProps,
	isEvent = false,
	isWorldBoss = false,
	prepareLootCb?: () => string
) {
	const stats = clone(raid.stats);
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
		raid.is_dark_zone
			? "Dark Zone"
			: isWorldBoss
				? "World"
				: isEvent
					? "Event"
					: "Raid"
	} Boss [${
		isWorldBoss ? "Global" : raid.is_private ? "Private" : "Public"
	}]**\n**${numericWithComma(stats.remaining_strength)} / ${numericWithComma(
		stats.original_strength
	)} ${emoji.hp}**\n${fakeHp.map((i) => i).join("")}\n\n**Element Type:** ${boss
		.map((c) => emojiMap(c.type))
		.join("")}${`\n**Raid Bosses: ${raid.raid_boss
		.map((b) => titleCase(b.name))
		.join(", ")}**`}\n**Boss Ability:** ${boss
		.map((c) => emojiMap(c.abilityname))
		.join(" ")}${
		isWorldBoss
			? `\n**Boss Energy (Lives):** ${raid.stats.battle_stats.energy || 1} ${
				emoji.hp
			}`
			: ""
	}\n**Total HP:** ${numericWithComma(
		stats.battle_stats.stats.strength
	)}\n**Total ATK:** ${numericWithComma(
		stats.battle_stats.stats.vitality
	)}\n**Total DEF:** ${numericWithComma(
		stats.battle_stats.stats.defense
	)}\n**Total SPD:** ${numericWithComma(
		stats.battle_stats.stats.dexterity
	)}\n**Total ARM:** ${numericWithComma(
		stats.battle_stats.stats.intelligence
	)}\n\n**Power Level:** ${numericWithComma(
		stats.battle_stats.power_level
	)}\n\n${
		prepareLootCb
			? prepareLootCb()
			: prepareLoot(boss, loot, isEvent, raid.is_dark_zone)
	}`;

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
	isEvent = false,
	isDarkZone = false
) {
	let extraDesc = "";

	if (isEvent) {
		extraDesc =
      `__${loot.drop.event?.shard}__ Shards ${emoji.shard}` +
      `${
      	loot.drop.event?.orbs
      		? `\n__${loot.drop.event.orbs}__ Orbs ${emoji.blueorb}`
      		: ""
      }`;
	}
	if (isDarkZone && loot.drop.darkZone?.fragments) {
		extraDesc = `__${loot.drop.darkZone?.fragments}x__ Fragments ${emoji.fragments}\n` +
		`__${loot.drop.darkZone.exp}__ Izzi Exp`;
	}

	const desc = `**__${
		isEvent ? "Event" : "Raid"
	} Rewards [For Everyone]__**\n__${numericWithComma(loot.gold)}__ Gold ${
		emoji.gold
	}${
		loot.gamePoints ? `\n__${loot.gamePoints}x__ Game Points :game_die:` : ""
	}\n${extraDesc}${
		loot.drop && loot.drop.default && !isEmptyObject(loot.drop.default)
			? loot.drop.default
				.map(
					(d) =>
						`__${d.number}x__ ${titleCase(d.rank)} of ${boss
							.map((b) => `**${titleCase(b.name)}**`)
							.join(", ")}`
				)
				.join("\n")
			: ""
	}${
		loot.rare
			? loot?.rare
				?.map(
					(d) =>
						`\n__${d.number}x__ ${titleCase(d.rank)} of ${boss
							.map((b) => `**${titleCase(b.name)}**`)
							.join(", ")} (At ${d.rate?.toFixed(2)}% per each card)${
							d.isStaticDropRate ? " (Fixed %)" : ""
						}`
				)
				.join("")
			: ""
	}\n\n**__Total Possible Drop Loot Rewards [Divided Among Lobby Members]__**\n__${numericWithComma(
		loot.extraGold || 0
	)}__ Gold ${emoji.gold}${
		loot.extraCards
			? loot.extraCards
				.map(
					(d) =>
						`\n__${d.number}x__ ${titleCase(d.rank)} of ${boss
							.map((b) => `**${titleCase(b.name)}**`)
							.join(", ")} (At ${d.rate?.toFixed(2)}% per each card)${
							d.isStaticDropRate ? " (Fixed %)" : ""
						}`
				)
				.join("")
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
			total_team_damage: 0,
		},
	};
}

export function prepareRaidTimer(currentRaid: RaidProps) {
	const timer = new Date(currentRaid.stats.timestamp);
	const remainingTime = (timer.valueOf() - new Date().valueOf()) / 1000 / 60;
	const remainingHours = Math.floor(remainingTime / 60);
	const remainingMinutes = Math.floor(remainingTime % 60);
	const title = `Timer [${remainingHours > 0 ? `${remainingHours}h` : ""} ${
		remainingMinutes > 0 ? `${remainingMinutes}m` : ""
	} | ID: ${currentRaid.id}]`;

	return title;
}
