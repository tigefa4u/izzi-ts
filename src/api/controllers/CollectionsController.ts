import {
	CollectionParams,
	CollectionProps,
	CollectionUpdateProps,
	ICollectionCreateProps,
} from "@customTypes/collections";
import loggers from "loggers";
import * as Collections from "../models/Collections";

export const createCollection: (
	data: ICollectionCreateProps
) => Promise<CollectionProps[] | CollectionProps | undefined> = async function (data) {
	try {
		loggers.info("creating collection with data: " + JSON.stringify(data));
		return await Collections.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.createCollection(): something went wrong",
			err
		);
		return;
	}
};

export const getCollection: (
  params: CollectionParams
) => Promise<CollectionProps[] | undefined> = async function (params) {
	try {
		const result = await Collections.get(params);
		return result;
	} catch (err) {
		loggers.error(
			"api.controllers.CollectionsController.getCollection(): something went wrong",
			err
		);
		return;
	}
};

export const updateCollection = async (
	params: Pick<CollectionParams, "id" | "ids">,
	data: CollectionUpdateProps
): Promise<number | undefined> => {
	try {
		loggers.info("Updating Collection with: " + JSON.stringify(params) + " Data: " + JSON.stringify(data));
		return await Collections.update(params, data);
	} catch (err) {
		loggers.error("api.controllers.CollectionsController.updateCollection(): something went wrong", err);
		return;
	}
};