import { Knex } from "knex";
import knexfile from "../knexfile";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("market_logs", (table) => {
		table.increments("id").primary();
		table.integer("character_id").references("characters.id").notNullable();
		table.integer("rank_id").references("ranks.rank_id").notNullable();
		table.integer("sold_at_cost").notNullable();
		table.jsonb("metadata");
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("market_logs")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("market_logs");
}

