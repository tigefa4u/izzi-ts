import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("monthly_cards", (table) => {
		table.increments("id").primary();
		table.integer("character_id").references("characters.id").notNullable();
		table.string("name").notNullable();
		table.jsonb("metadata");
		table.boolean("is_active").defaultTo(false);
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);

		table.unique([ "character_id" ], { indexName: "monthly_cards_cid" });
	}).then(() => knex.raw(knexfile.onUpdateTrigger("monthly_cards")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("monthly_cards");
}

