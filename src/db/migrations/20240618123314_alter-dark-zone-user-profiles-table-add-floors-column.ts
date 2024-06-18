import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_user_profiles", (table) => {
		table.integer("floor").defaultTo(1);
		table.integer("max_floor").defaultTo(1);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_user_profiles", (table) => {
		table.dropColumns("max_floor", "floor");
	});
}

