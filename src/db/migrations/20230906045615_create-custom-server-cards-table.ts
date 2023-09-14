import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("custom_server_cards", (table) => {
		table.increments("id").primary();
		table.integer("character_id").references("characters.id");
		table.string("series");
		table.jsonb("guild_ids");
		table.string("submitted_by").notNullable();
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("custom_server_cards")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("custom_server_cards");
}

