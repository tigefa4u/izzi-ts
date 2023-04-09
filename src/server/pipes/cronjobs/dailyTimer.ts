import { CharacterPriceListCreateProps } from "@customTypes/characters";
import connection from "db";
import { delay } from "helpers";
import loggers from "loggers";
import "../../../module";

const calculateAveragePrice = async () => {
	const marketLogs = await connection
		.select(
			connection.raw(
				`rank_id, character_id, avg(sold_at_cost) as average_price, 
                count(character_id) as total_sold`
			)
		)
		.from("market_logs")
		.groupBy("character_id")
		.groupBy("rank_id");

	const data: CharacterPriceListCreateProps = [];
	if (marketLogs && marketLogs.length > 0) {
		marketLogs.map(async (item) => {
			if (Number(item.total_sold) >= 5) {
				data.push({
					average_market_price: Math.floor(+item.average_price),
					character_id: item.character_id,
					rank_id: item.rank_id
				});
			}
		});
	}

	if (data.length > 0) {
		loggers.info("Creating or Updating character_price_list data with: ", { data });
		await connection("character_price_lists").insert(data).onConflict([ "character_id", "rank_id" ]).merge();
	}
};

(async function boot() {
	try {
		await calculateAveragePrice();
	} catch (err) {
		loggers.error("cronjobs.dailyTimers: ERROR", err);
	} finally {
		loggers.info("cronjobs.dailyTimers: all tasks completed...");
		await delay(1000);
		process.exit(1);
	}
})();
