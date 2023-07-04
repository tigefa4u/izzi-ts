import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("change_logs", (table) => {
		table.increments("id").primary();
		table.string("name").notNullable();
		table.text("description").notNullable();
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("change_logs")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("change_logs");
}

