import loggers from "loggers";
import * as CustomCards from "../models/CustomCards";

export const getCustomCards = async (user_tag: string) => {
	try {
		loggers.info("CustomCardsController.getCustomCards: fetching data for user -> " + user_tag);
		return CustomCards.getByUser(user_tag);
	} catch (err) {
		loggers.error("CustomCardsController.getCustomCards: ERROR", err);
		return;
	}
};