import { ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import {
	ReferralCreateProps,
	ReferralParamProps,
	ReferralProps,
} from "@customTypes/referrals";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Referrals from "../models/Referrals";

export const getAllReferrals = async (
	params: { referred_to: string },
	filter: PageProps
): Promise<undefined | ResponseWithPagination<ReferralProps[]>> => {
	try {
		const result = await Referrals.getAll(
			params,
			await paginationParams(filter)
		);
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
			"api.controllers.ReferralsController.getAllReferrals: ERROR",
			err
		);
		return;
	}
};

export const getReferral = async (params: Partial<ReferralParamProps>) => {
	try {
		const result = await Referrals.get(params);
		return result[0];
	} catch (err) {
		loggers.error(
			"api.controllers.ReferralsController.getReferral: ERROR",
			err
		);
		return;
	}
};

export const getReferrals = async (params: Partial<ReferralParamProps>) => {
	try {
		return Referrals.get(params);
	} catch (err) {
		loggers.error(
			"api.controllers.ReferralsController.getReferrals: ERROR",
			err
		);
		return;
	} 
};

export const updateReferral = async (
	params: ReferralParamProps,
	data: Partial<ReferralCreateProps>
) => {
	try {
		return Referrals.update(params, data);
	} catch (err) {
		loggers.error(
			"api.controllers.ReferralsController.updateReferral: ERROR",
			err
		);
		return;
	}
};

export const createReferral = async (data: ReferralCreateProps) => {
	try {
		loggers.info(
			"api.controllers.ReferralsController.createReferral: creating referral with data -> " +
        JSON.stringify(data)
		);
		return Referrals.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.ReferralsController.createReferral: ERROR",
			err
		);
		return;
	}
};
