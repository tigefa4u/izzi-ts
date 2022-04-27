import { DonationProps } from "@customTypes/donations";
import connection from "db";

const tableName = "donations";

export const get = async (user_tag: string): Promise<DonationProps[]> => {
	return connection(tableName).where({ user_tag });
};