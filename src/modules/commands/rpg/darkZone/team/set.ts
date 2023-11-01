import { DzFuncProps } from "@customTypes/darkZone";
import { TeamMeta } from "@customTypes/teams";
import { getCardInfoByRowNumber } from "api/controllers/CollectionInfoController";
import {
	createDzTeam,
	getDzTeam,
	updateDzTeam,
} from "api/controllers/DarkZoneTeamsController";
import loggers from "loggers";
import { titleCase } from "title-case";

export const setDzTeam = async ({ context, args, options }: DzFuncProps) => {
	try {
		const { author } = options;
		const rowNum = parseInt(args.shift() || "0");
		const position = parseInt(args.shift() || "0");
		if (rowNum <= 0 || isNaN(rowNum) || position <= 0 || isNaN(position)) {
			context.channel?.sendMessage(
				"Please type `iz dz tm set 1 2` to set a card on your team."
			);
			return;
		}
		const cards = await getCardInfoByRowNumber({
			row_number: rowNum,
			isDarkZone: true,
			user_tag: author.id,
			user_id: 0,
		});
		const card = (cards || [])[0];
		if (!card) {
			context.channel?.sendMessage(
				"We could not find the card you were looking for in your inventory."
			);
			return;
		}
		const dzTeam = await getDzTeam(author.id);
		if (dzTeam) {
			const idx = dzTeam.team.findIndex((c) => c.collection_id === card.id);
			if (idx >= 0) {
				dzTeam.team[idx].collection_id = null;
			}
			dzTeam.team[position - 1].collection_id = card.id;
			await updateDzTeam(author.id, { team: JSON.stringify(dzTeam.team) as any, });
		} else {
			const team: TeamMeta[] = [ 1, 2, 3 ].map((n) => ({
				collection_id: null,
				position: n,
			}));
			team[position - 1].collection_id = card.id;
			await createDzTeam({
				team: JSON.stringify(team) as any,
				user_tag: author.id,
			});
		}
		context.channel?.sendMessage(
			`Successfully assigned **Level ${card.character_level}** ` +
        `__${titleCase(card.rank)}__ **${titleCase(
        	card.metadata?.nickname || card.name
        )}** to position __${position}__`
		);
		return;
	} catch (err) {
		loggers.error("team.seetDzTeam: ERROR", err);
		return;
	}
};
