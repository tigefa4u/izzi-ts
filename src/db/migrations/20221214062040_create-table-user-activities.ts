import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("user_activities", (table) => {
		table.increments("id").primary();
		table.integer("game_points").defaultTo(0);
		table.string("type").notNullable();
		table.integer("season").notNullable();
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("user_activities")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("user_activities");
}

