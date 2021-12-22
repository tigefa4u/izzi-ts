import _ from "lodash";
import { NormalizeFloorProps, StageProps } from "@customTypes/stages";
import { calcPercentRatio } from "./ability";
import { getRPGUser } from "api/controllers/UsersController";
import { AuthorProps } from "@customTypes";

export const prepareAbilityDescription = (desc = "", rank?: string) => {
	return desc.replace(/\{(.*?)\}/gm, (num) => replaceDescriptionNumber(num, rank))
		.replace(/\[(.*?)\]/gm, (num) =>
			parseInt(num.match(/\[([^)]+)\]/)?.[1] || "0").toString()
		);
};

export const replaceDescriptionNumber = (numStr: string, rank = "silver") => {
	const num = parseInt(numStr.match(/\{([^)]+)\}/)?.[1] || "0");
	return calcPercentRatio(num, rank).toString();
};

export const normalizeFloors: (data: StageProps[]) => NormalizeFloorProps = (data) => {
	const location_id = Number((data[0] || {}).location_id || 0);
	const floors: number[] = data.map((i) => i.floor);
	return {
		zone: location_id,
		floors,
	};
};

export const randomNumber = (num1: number, num2: number, float = false) => {
	return _.random(num1, num2, float);
};

export const randomElementFromArray = <T>(array: T[]) => {
	return _.sample<T>(array);
};

export const validateAccountCreatedAt = (author: AuthorProps) => {
	const dateOffset = 24 * 60 * 60 * 1000 * 60;
	const verifyDate = new Date();
	verifyDate.setTime(verifyDate.getTime() - dateOffset);
	if (new Date(verifyDate) <= new Date(author.createdTimestamp)) return false;
	return true;
};

export const checkExistingAccount = async (id: string) => {
	const userFound = await getRPGUser({ user_tag: id });
	if (userFound) return true;
	return false;
};
