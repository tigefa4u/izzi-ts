import knex from "knex";
import loggers from "loggers";
import knexfile from "./knexfile";

const env = "development";
const envConfig = knexfile[env];

const connection = knex(envConfig);

(function () {
	setInterval(() => {
		connection
			.raw("SELECT 1")
			.then(() => {
				console.log("PostgreSQL connected");
				loggers.info("PostgreSQL connected");
			})
			.catch((e) => {
				console.log("PostgreSQL not connected");
				loggers.error("PostgreSQL connection failed", e);
				console.error(e);
			});
	}, 1000 * 60 * 60);
})();

export default connection;
