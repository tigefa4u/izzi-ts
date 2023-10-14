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
			max: 5,
		},
		migrations: {
			tableName: "knex_migrations_ts",
			directory: "migrations",
		},
	},
	onUpdateTrigger: (table: string) => `
  CREATE TRIGGER ${table}_updated_at
  BEFORE UPDATE ON ${table}
  FOR EACH ROW
  EXECUTE PROCEDURE on_update_timestamp();`,
	onUpdateNotificationTrigger: (table: string) => `CREATE TRIGGER ${table}_notify_trigger
	AFTER UPDATE ON ${table}
	FOR EACH ROW
	EXECUTE FUNCTION notify_changes();`,
	onUpdateNotificationDropTrigger: (table: string) => `DROP TRIGGER ${table}_notify_trigger on ${table};`,
};
/**
 * Trigger functions have been manually executed on pg_admin
 */
// CREATE OR REPLACE FUNCTION on_update_timestamp()
// RETURNS TRIGGER AS $$
// BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// CREATE OR REPLACE FUNCTION notify_changes() RETURNS trigger AS $$
// BEGIN
//     -- Publish to Redis using tablename as part of channel
//	   -- Generic triggers. Now you can listen to 'tablename' on pubsub
//     PERFORM pg_notify(TG_TABLE_NAME, row_to_json(NEW)::text);
//     RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// Need to use query - listen table_name