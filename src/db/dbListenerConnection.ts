import Cache from "cache";
import { CACHE_KEYS } from "helpers/constants/cacheConstants";
import knex from "knex";
import loggers from "loggers";
import knexfile from "./knexfile";

const env = "development";
const envConfig = knexfile[env];

type T = "USERS" | "DARK_ZONE_USER_PROFILES"
const TOPICS: { [key in T]: string; } = {
	USERS: "users",
	DARK_ZONE_USER_PROFILES: "dark_zone_user_profiles"
};

const refreshCache = async (msg: any) => {
	const topic = msg.channel;
	try {
		console.log("Refreshing cache: ", msg);
		// loggers.info("[dblistener] refreshing cache with data: ", msg);
		const payload = JSON.parse(msg.payload);
		let key;
		if (topic === TOPICS.USERS) {
			key = CACHE_KEYS.USER + payload.user_tag;
		} else if (topic === TOPICS.DARK_ZONE_USER_PROFILES) {
			key = CACHE_KEYS.DARK_ZONE_PROFILE + payload.user_tag;
		}
		// loggers.info("[dblistener] key: ", key);
		if (key) {
			console.log("[dblistener] cache refreshed for key: ", key);
			await Cache.set(key, msg.payload);
			await Cache.expire(key, 60 * 60 * 23);
		}
	} catch (err) {
		console.log("[dblistener] Error with notification", err);
		loggers.error("[dblistener] Unable to refresh cache: ", err);
	}
};

let listening = false;
const connection = knex({
	...envConfig,
	pool: {
		...envConfig.pool,
		afterCreate: async (conn: any, done: any) => {
			console.log("Pool created");
			if (listening) {
				done(null, conn);
				return;
			}
			listening = true;
			console.log("Listening to update triggers");
			await Promise.all(Object.keys(TOPICS).map((k) => conn.query(`LISTEN ${TOPICS[k as T]}`)));
			await conn.on("notification", (msg: any) => {
				refreshCache(msg);
			});
			done(null, conn);
		}
	}
});

(function () {
	const interval = setInterval(() => {
		connection
			.raw("SELECT 1")
			.then(() => {
				console.log("PostgreSQL listener connected");
				loggers.info("PostgreSQL listener connected");
				clearInterval(interval);
			})
			.catch((e) => {
				console.log("PostgreSQL listener not connected");
				loggers.error("PostgreSQL listener connection failed", e);
				console.error(e);
			});
	}, 1000 * 60 * 60);
})();

export default connection;
