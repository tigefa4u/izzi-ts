import { BaseProps } from "@customTypes/command";
import { getCollection } from "api/controllers/CollectionsController";
import loggers from "loggers";

export const collection = async ({ context, client, args = [], options }: BaseProps) => {
	try {
		const author = options?.author;
		if (!author) return;
		console.time("inv");
		const collections = await getCollection({
			user_id: 54,
			is_item: false,
			is_on_market: false 
		});
		console.timeEnd("inv");
		console.log({ collections });
	} catch (err) {
		loggers.error("modules.commands.rpg.inventory.collection(): something went wrong", err);
		return;
	}
};