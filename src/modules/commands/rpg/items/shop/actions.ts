import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import loggers from "loggers";

export const purchaseItem = async ({
	context,
	client,
	args,
	author,
}: Omit<BaseProps, "options"> & { author: AuthorProps }) => {
	try {
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		return; 
	} catch (err) {
		loggers.error(
			"modules.commands.items.shop.purchaseItem(): something went wrong",
			err
		);
		return;
	}
};
