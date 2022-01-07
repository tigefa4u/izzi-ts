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
	}
];

export const fetchParamsFromArgs = <T>(args: string[]): ParamsFromArgsRT<T> | Record<string, never> => {
	const params = {};
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
		if (index >= 0) {
			Object.assign(params, { [argMap[index].name]: value });
		}
		i--;
	}
	return params;
};