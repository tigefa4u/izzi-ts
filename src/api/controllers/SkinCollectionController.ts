import { ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import { CreateSkinCollectionProps, ISkinCollection } from "@customTypes/skins";
import { UserProps } from "@customTypes/users";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as SkinCollections from "../models/SkinCollections";

export const getSkinCollection = async (
	params: Pick<UserProps, "user_tag"> & { name: string[] | string; },
	filter: PageProps
): Promise<
  ResponseWithPagination<Omit<ISkinCollection, "metadata">[]> | undefined
> => {
	try {
		const result = await SkinCollections.getAll(params, await paginationParams(filter));
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
			"api.controllers.SkinCollectionController.getSkinCollection: somethig went wrong",
			err
		);
		return;
	}
};

export const getSkinCollectionById = async (params: {
    id: number;
    user_tag: string;
}) => {
	try {
		const result = await SkinCollections.get(params);
		return result[0];
	} catch (err) {
		loggers.error("api.controllers.SkinCollectionController.getSkinCollectionById: ERROR", err);
		return;
	}
};

export const delSkinCollection = async (params: { id: number }) => {
	try {
		loggers.info("Deleting skin collection for ID: " + params.id);
		return await SkinCollections.del(params);
	} catch (err) {
		loggers.error("api.controllers.SkinCollectionController.delSkinCollection: ERROR", err);
		return;
	}
};

export const createSkinCollection = async (data: CreateSkinCollectionProps) => {
	try {
		loggers.info("Creating skin collection with details: -> " + JSON.stringify(data));
		return await SkinCollections.create(data);
	} catch (err) {
		loggers.error("api.controllers.SkinCollectionController.createSkinCollection()", err);
		return;
	}
};