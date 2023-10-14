import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("dark_zone_markets", (table) => {
		table.increments("id").primary();
		table.string("user_tag").references("users.user_tag");
		table.integer("collection_id").references("dark_zone_collections.id");
		table.integer("price").defaultTo(0);
		table.jsonb("stats").notNullable();
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("dark_zone_markets")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("dark_zone_markets");
}

