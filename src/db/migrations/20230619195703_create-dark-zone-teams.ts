import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("dark_zone_teams", (table) => {
		table.increments("id").primary();
		table.string("user_tag").references("users.user_tag").notNullable();
		table.jsonb("team").defaultTo("{}");
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("dark_zone_teams")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("dark_zone_teams");
}

