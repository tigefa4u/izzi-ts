import { BaseProps } from "@customTypes/command";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import { getDGTeam, updateDGTeam } from "api/controllers/DungeonsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants";
import loggers from "loggers";
import { titleCase } from "title-case";
import { getSortCache } from "../../sorting/sortCache";

export const setDGTeam = async ({
	context,
	options,
	args,
	client,
}: BaseProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const posi = Number(args.shift());
		if (!posi || isNaN(posi)) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		if (posi <= 0 || posi > 3) {
			embed.setDescription(
				"Please provide a valid team position (1 or 2 or 3)"
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const dgTeam = await getDGTeam(author.id);
		if (!dgTeam) {
			embed.setDescription(
				`Summoner **${author.username}**, You do not ` +
          "have a DG Team. Create one using ``iz dg create <name>``."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const [ user, sort ] = await Promise.all([
			getRPGUser({ user_tag: author.id }, { cached: true }),
			getSortCache(author.id),
		]);
		if (!user) return;
		const collections = await getCardInfoByRowNumber(
			{
				user_id: user.id,
				row_number: id,
			},
			sort
		);
		if (!collections || collections.length <= 0) {
			embed.setDescription(
				"We could not find the card you were looking for in your inventory."
			);
			context.channel?.sendMessage(embed);
			return;
		}
		const collection = collections[0];
		const idx = dgTeam.team.metadata.findIndex((m) => m?.collection_id === collection.id);
		if (idx >= 0) {
			dgTeam.team.metadata[idx].collection_id = null;
		}
		if (dgTeam.team.metadata[posi - 1]) {
			dgTeam.team.metadata[posi - 1].collection_id = collection.id;
		} else {
			dgTeam.team.metadata[posi - 1] = {
				collection_id: collection.id,
				position: posi
			};
		}
		await updateDGTeam(author.id, { team: dgTeam.team, });
		embed
			.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(
				`Successfully set **Level ${collection.character_level}** __${titleCase(
					collection.rank
				)}__ **${titleCase(collection.name)}** to __Position #${posi}__`
			);

		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("dungeon.v2.set.setDGTeam: ERROR", err);
		return;
	}
};
