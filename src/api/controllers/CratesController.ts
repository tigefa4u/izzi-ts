import { ResponseWithPagination } from "@customTypes";
import { CrateParamProps, CrateProps } from "@customTypes/crates";
import { PageProps } from "@customTypes/pagination";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Crates from "../models/Crates";

export const getCrates = async (
	params: CrateParamProps,
	filter: PageProps
): Promise<ResponseWithPagination<CrateProps[]> | undefined> => {
	try {
		const result = await Crates.getAll(params, await paginationParams(filter));
		const pagination = await paginationForResult({
			data: result,
			query: filter,
		});
		return {
			data: result,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error(
			"api.controllers.CratesController.getCrates(): something went wrong",
			err
		);
		return;
	}
};

export const getCrate = async (params: { id: number; user_tag: string }) => {
	try {
		const result = await Crates.get(params);
		return result[0];
	} catch (err) {
		loggers.error(
			"api.controllers.CratesController.getCrate(): something went wrong",
			err
		);
		return;
	}
};

export const delCrate = async (params: { id: number }) => {
	try {
		return await Crates.del(params);
	} catch (err) {
		loggers.error(
			"api.controllers.CratesController.delCrate(): something went wrong",
			err
		);
		return;
	}
};