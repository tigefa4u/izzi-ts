import { Client } from "discord.js";
import { emojiMap } from "emojis";
import emoji from "emojis/emoji";
import { titleCase } from "title-case";

export const createLBEmbedList = (
	array: any[],
	client: Client,
	order: string,
	lb: string
) => {
	return Promise.all(
		array.map((item, i) => {
			if (lb === "guilds") {
				return {
					guild_name: item.name || item.guild_name || "",
					index: i,
				};
			} else {
				return {
					username: item.username,
					id: item.id,
					index: i,
				};
			}
		})
	).then((res) =>
		res.map((obj) => {
			if (lb === "guilds") {
				return Object.assign(
					{},
					{
						name: `#${obj.index + 1}| ${array[obj.index].name || ""} (${
							array[obj.index].guild_id
						})`,
						value: `War Points __${array[obj.index].points}__ | Clan Level **${
							array[obj.index].guild_level || 0
						}** ${emoji.up}`,
					}
				);
			} else if (lb === "ranks") {
				return Object.assign(
					{},
					{
						name: `#${obj.index + 1}| ${obj.username} (${obj.id})`,
						value: `${titleCase(order)} **${titleCase(
							array[obj.index][order]
						)}** ${emojiMap(array[obj.index]["rank"])} ${
							array[obj.index]["rank_id"] === 5 ? "Grand Master" : "Division"
						}: __${array[obj.index]["division"]}__ ${emojiMap(
							`${
								array[obj.index]["rank_id"] === 5 ? "grand master" : "division"
							}${array[obj.index]["division"]}`
						)} Exp: __${array[obj.index]["exp"]}__ Wins: __${
							array[obj.index]["wins"]
						}__ Loss: ${array[obj.index]["loss"]}`,
					}
				);
			}
			// | Server **${obj.guild_name}**
			return Object.assign(
				{},
				{
					name: `#${obj.index + 1}| ${obj.username} (${obj.id})`,
					value: `${titleCase(order)} **${array[obj.index][order]}** ${
						order === "zone"
							? `Max Floor **${array[obj.index]["max_floor"]}**`
							: ""
					} ${order === "gold" ? emoji.gold : order === "zone" ? ":map:" : emoji.up}`,
				}
			);
		})
	);
};
