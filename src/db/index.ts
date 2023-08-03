import knex from "knex";
import knexfile from "./knexfile";

const env = "development";
const envConfig = knexfile[env];

const connection = knex(envConfig);

(function () {
	connection
		.raw("SELECT 1")
		.then(() => {
			console.log("PostgreSQL connected");
		})
		.catch((e) => {
			console.log("PostgreSQL not connected");
			console.error(e);
		});
})();

export default connection;
