import { XPGainPerRankProps } from "@customTypes";
import { XP_PER_FRAGMENT } from "./constants/darkZone";
import { XP_GAIN_PER_RANK } from "./constants/rankConstants";

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

// Dark Zone
export const getXpGainFromFragments = (reqExp: number) => {
	return Math.ceil(reqExp / XP_PER_FRAGMENT);
};
