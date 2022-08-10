import loggers from "loggers";
import * as Donations from "../models/Donations";

export const getDonation = async (user_tag: string) => {
	try {
		return Donations.get(user_tag);
	} catch (err) {
		loggers.error("api.controllers.DonationsController.getDonation(): something went wrong", err);
		return;
	}
};