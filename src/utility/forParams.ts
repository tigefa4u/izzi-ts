import { ParamsFromArgsRT } from "@customTypes";

const argMap = [
	{
		name: "series",
		alias: [ "-s", "-series" ]
	},
	{
		name: "abilityname",
		alias: [ "-a", "-ability" ]
	},
	{
		name: "name",
		alias: [ "-n", "-name" ]
	},
	{
		name: "type",
		alias: [ "-t", "-type" ]
	},
	{
		name: "rank",
		alias: [ "-r", "-rank" ]
	},
	{
		name: "category",
		alias: [ "-c", "category" ]
	},
	{
		name: "is_favorite",
		alias: [ "-fav" ]
	},
	{
		name: "is_on_market",
		alias: [ "-mk", "-market" ]
	},
	{
		name: "difficulty",
		alias: [ "-d", "-difficulty" ]
	},
	{
		name: "limit",
		alias: [ "-l", "-limit" ]
	},
	{
		name: "exclude",
		alias: [ "-ex", "-exclude" ]
	},
	{
		name: "page",
		alias: [ "-pg", "-page" ]
	},
	{
		name: "year",
		alias: [ "-year" ]
	},
	{
		name: "channel",
		alias: [ "-ch", "-channel" ]
	},
	{
		name: "role",
		alias: [ "-ro", "-role" ]
	},
	{
		name: "is_on_cooldown",
		alias: [ "-cd" ]
	},
	{
		name: "collection_ids",
		alias: [ "-cid" ]
	},
	{
		name: "isExactMatch",
		alias: [ "-exm" ]
	}
];

const exceptionalFilters = [ "is_favorite", "is_on_market", "is_on_cooldown" ];

export const fetchParamsFromArgs = <T>(args: string[]): ParamsFromArgsRT<T> => {
	const params = {} as ParamsFromArgsRT<T>;
	for (let i = 0; i < args.length; i++) {
		const temp = args.shift();
		if (!temp) break;
		const index = argMap.findIndex((i) => i.alias.includes(temp));
		let value;
		let idx = -1;
		for (let j = 0; j < args.length; j++) {
			idx = argMap.findIndex((obj) => obj.alias.includes(args[j]));
			if (idx >= 0) {
				idx = j;
				break;
			} else idx = -1;
		}
		if (idx >= 0) {
			const tempArr = args.slice(0, idx);
			value = tempArr.join(" ").trim();
			value = value.split(",");
			args = args.slice(tempArr.length);
		} else {
			value = args.join(" ").trim();
			value = value.split(",");
			args = args.slice(args.length);
		}
		if (value.length > 100) {
			value.splice(0, 100);
		}
		if (index >= 0) {
			const key = argMap[index].name;
			if (typeof value === "object" && (!value.some((v) => v === "") || exceptionalFilters.includes(key))) {
				Object.assign(params, { [key]: value.map((v) => v.trim()) });
			}
		}
		i--;
	}
	return params;
};