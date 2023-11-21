import { DonationProps } from "@customTypes/donations";
import connection from "db";

const tableName = "donations";

export const get = async (user_tag: string): Promise<DonationProps[]> => {
	return connection(tableName).where({ user_tag });
};

export const getTotal = async (user_tag: string): Promise<any> => {
	return connection(tableName).sum("amount").where({ user_tag })
		.then((res) => res[0]);
};

export const update = async (id: string, user_tag: string) => {
	return connection(tableName).where({ id }).update({ user_tag });
};

export const updateByTransactionId = (transactionId: string, user_tag: string) => {
	return connection(tableName).where({ transaction_id: transactionId }).update({ user_tag });
};