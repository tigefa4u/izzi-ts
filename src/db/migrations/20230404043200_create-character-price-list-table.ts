import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("character_price_lists", (table) => {
		table.increments("id").primary();
		table.integer("character_id").references("characters.id").notNullable();
		table.integer("rank_id").references("ranks.rank_id").notNullable();
		table.integer("average_market_price").defaultTo(0);
		table.jsonb("metadata");
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("character_price_lists")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("character_price_lists");
}

