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
		alias: [ "-mk" ]
	},
	{
		name: "difficulty",
		alias: [ "-d", "-difficulty" ]
	},
	{
		name: "limit",
		alias: [ "-l" ]
	},
	{
		name: "exclude",
		alias: [ "-ex" ]
	},
	{
		name: "page",
		alias: [ "-pg" ]
	}
];

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
			value = tempArr.join(" ");
			value = value.split(",");
			args = args.slice(tempArr.length);
		} else {
			value = args.join(" ");
			value = value.split(",");
			args = args.slice(args.length);
		}
		if (value.length > 5) {
			value.splice(0, 5);
		}
		if (index >= 0) {
			Object.assign(params, { [argMap[index].name]: value });
		}
		i--;
	}
	return params;
};