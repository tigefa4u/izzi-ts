import { AuthorProps } from "@customTypes";
import { BaseProps } from "@customTypes/command";
import { getYearlyTaxPaid } from "api/controllers/MarketLogsController";
import { getRPGUser } from "api/controllers/UsersController";
import { createEmbed } from "commons/embeds";
import emoji from "emojis/emoji";
import { numericWithComma } from "helpers";
import {
	MARKET_COMMISSION,
	RAID_TREASURY_PERCENT,
	TAXPAYER_RETURN_PERCENT,
	TAX_PAYER_RAID_PITY_THRESHOLD,
} from "helpers/constants/constants";
import loggers from "loggers";

export const showTaxInfo = async ({
	context,
	client,
	author,
}: Omit<BaseProps, "options"> & { author: AuthorProps }) => {
	try {
		const embed = createEmbed(author, client).setTitle(
			"Dark Zone/Global Market Tax Info Past 12 Months"
		);
		const [ result, user ] = await Promise.all([
			getYearlyTaxPaid({ user_tag: author.id }),
			getRPGUser({ user_tag: author.id }),
		]);
		if (!user) return;
		const total = Number(result?.sum || 0);
		const commission = Math.floor(total * TAXPAYER_RETURN_PERCENT);

		let taxReturns =
      commission -
      (user.metadata?.raidPityCount || 0) * TAX_PAYER_RAID_PITY_THRESHOLD;
		if (taxReturns < 0) taxReturns = 0;
		embed.setDescription(
			`**Total Cards Sold:** ${numericWithComma(
				result?.count || 0
			)}\n**Total Tax Paid:** ${numericWithComma(total)} ${
				emoji.gold
			}\n**Tax Rate:** ${MARKET_COMMISSION * 100}%\n**Raid Pity Rate:** ${
				TAXPAYER_RETURN_PERCENT * 100
			}% of Total Tax Paid (${
				RAID_TREASURY_PERCENT * 100
			}% goes to Izzi Treasury)\n**Raid Pity (Spawn a card from wishlist):** ${numericWithComma(
				taxReturns
			)} / ${numericWithComma(TAX_PAYER_RAID_PITY_THRESHOLD)} ${
				emoji.gold
			}\n\n**Note: You can sell Xenex series, Referral Cards or Event cards on the ` +
        "Global Market to increase the Tax Meter. But those cards will not be spawned from Wishlist.**"
		);
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		console.log(err);
		loggers.error("market.shop.tax.showTaxInfo: ERROR", err);
		return;
	}
};
