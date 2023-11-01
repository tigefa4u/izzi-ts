import loggers from "loggers";
import * as Donations from "../models/Donations";

export const getDonation = async (user_tag: string) => {
	try {
		return Donations.get(user_tag);
	} catch (err) {
		loggers.error("api.controllers.DonationsController.getDonation: ERROR", err);
		return;
	}
};

export const getTotalDonations = async (user_tag: string): Promise<{ sum: number; } | undefined> => {
	try {
		return Donations.getTotal(user_tag);
	} catch (err) {
		loggers.error("DonationsController.getTotalDonations: ERROR", err);
		return;
	}
};
