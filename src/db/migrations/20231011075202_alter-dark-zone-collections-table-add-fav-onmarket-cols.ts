import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_collections", (table) => {
		table.boolean("is_favorite").defaultTo(false);
		table.boolean("is_on_market").defaultTo(false);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_collections", (table) => {
		table.dropColumns("is_favorite", "is_on_market");
	});
}

