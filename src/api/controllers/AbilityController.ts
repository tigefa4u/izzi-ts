import { FilterProps, ResponseWithPagination } from "@customTypes";
import { AbilityProps } from "@customTypes/abilities";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Ability from "../models/Abilities";

export const getAbilities = async (
	filter: Pick<FilterProps, "name">,
	pageProps: PageProps,
): Promise<ResponseWithPagination<AbilityProps[]> | undefined> => {
	try {
		const result = await Ability.get(await paginationParams(pageProps), filter);
		const pagination = await paginationForResult({
			data: result,
			query: pageProps,
		});
		return {
			data: result,
			metadata: pagination
		};
	} catch (err) {
		loggers.error(
			"api.controllers.AbilityController.getAbilities: ERROR",
			err
		);
		return;
	}
};

/**
 * Currently only logging abilities that are used in raids.
 * @param id 
 * @returns 
 */
export const logAbilityUsage = async (names: string[]) => {
	try {
		return Ability.logUsage(names);
	} catch (err) {
		loggers.error("api.controllers.AbilityController.logAbilityUsage: ERROR", err);
		return;
	}
};