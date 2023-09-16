import { XPGainPerRankProps } from "@customTypes";
import { XP_GAIN_PER_RANK } from "./rankConstants";

export const prepareXpGainObject = (reqExp: number) => {
	const withSameName = {} as XPGainPerRankProps;
	const withDifferentName = {} as XPGainPerRankProps;
	Object.keys(XP_GAIN_PER_RANK)
		.slice(0, 3)
		.forEach((r) => {
			Object.assign(withSameName, {
				[r]: Math.ceil(
					reqExp / (3 * XP_GAIN_PER_RANK[r as keyof XPGainPerRankProps])
				),
			});
			Object.assign(withDifferentName, {
				[r]: Math.ceil(
					reqExp / XP_GAIN_PER_RANK[r as keyof XPGainPerRankProps]
				),
			});
		});

	return {
		withSameName,
		withDifferentName 
	};
};