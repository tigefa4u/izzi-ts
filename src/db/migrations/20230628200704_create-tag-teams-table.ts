import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("tag_teams", (table) => {
		table.increments("id").primary();
		table.string("name").notNullable().unique();
		table.jsonb("players").notNullable();
		table.integer("points").defaultTo(0);
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("tag_teams")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("tag_teams");
}

