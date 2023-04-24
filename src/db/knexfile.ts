import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

export default {
	development: {
		client: "pg",
		connection: {
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
		},
		pool: {
			min: 1,
			max: 5
		},
		migrations: {
			tableName: "knex_migrations_ts",
			directory: "migrations" 
		}
	},
	onUpdateTrigger: (table: string) => `
  CREATE TRIGGER ${table}_updated_at
  BEFORE UPDATE ON ${table}
  FOR EACH ROW
  EXECUTE PROCEDURE on_update_timestamp();`,
};
// CREATE OR REPLACE FUNCTION on_update_timestamp()
// RETURNS TRIGGER AS $$
// BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;
