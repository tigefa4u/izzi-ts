import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_user_profiles", (table) => {
		table.integer("inventory_count").defaultTo(0);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_user_profiles", (table) => {
		table.dropColumn("inventory_count");
	});
}

