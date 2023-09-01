import { MonthlyCardWithFilepathProps } from "@customTypes/monthlyCards";
import loggers from "loggers";
import * as MonthlyCards from "../models/MonthlyCards";

export const getMonthlyCard = async (): Promise<MonthlyCardWithFilepathProps[] | undefined> => {
	try {
		return MonthlyCards.get();
	} catch (err) {
		loggers.error("MonthlyCardsController.getMonthlyCard: ERROR", err);
		return;
	}
};