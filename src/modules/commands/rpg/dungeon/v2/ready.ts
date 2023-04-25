import { BaseProps } from "@customTypes/command";
import { DungeonBanProps } from "@customTypes/dungeon";
import { getCollectionById } from "api/controllers/CollectionInfoController";
import { getDGTeam, updateDGTeam } from "api/controllers/DungeonsController";
import { getRPGUser } from "api/controllers/UsersController";
import Cache from "cache";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";

export const dgTeamReady = async ({ client, context, options }: BaseProps) => {
	try {
		const { author } = options;
		const [ bans, dgTeam, user ] = await Promise.all([
			Cache.get("dg-bans"),
			getDGTeam(author.id),
			getRPGUser({ user_tag: author.id }, { cached: true })
		]);
		if (!user) return;
		let dungeonBans: DungeonBanProps = {};
		if (bans) {
			dungeonBans = JSON.parse(bans);
		}
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (!dgTeam || !dgTeam.team) {
			embed.setDescription(`Summoner **${author.username}**, You do not have a DG Team! Create a DG Team ` +
            "using ``iz dg create <name>``");

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
					},
				});
				embed.setTitle(DEFAULT_ERROR_TITLE)
					.setDescription(`Summoner **${author.username}**, Your DG Team has Banned Items or Abilities.` +
				" Set a valid Team to Battle!\n\nUse ``iz dg bans`` to view all banned abilities and items.");
	
				context.channel?.sendMessage(embed);
				return;
			}
		}
		await updateDGTeam(author.id, {
			metadata: {
				...dgTeam.metadata,
				isValid: true
			}
		});
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription("Your DG Team is ready to fight!");

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("dungeon.v2.ready.dgTeamReady: ERROR", err);
		return;
	}
};