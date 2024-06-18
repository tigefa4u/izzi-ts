import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("dark_zone_floors", (table) => {
		table.increments("id").primary();
		table.integer("floor").notNullable().unique();
		table.integer("level").notNullable();
		table.jsonb("card_ids").notNullable();
		table.timestamps(true, true);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("dark_zone_floors");
}

