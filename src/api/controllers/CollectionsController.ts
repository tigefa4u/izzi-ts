import {
	CollectionParams,
	CollectionProps,
	ICollectionCreateProps,
} from "@customTypes/collections";
import loggers from "loggers";
import * as Collections from "../models/Collections";

export const createCollection: (
	data: ICollectionCreateProps
) => Promise<CollectionProps[] | CollectionProps | undefined> = async function (data) {
	try {
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
