import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_user_profiles", (table) => {
		table.integer("user_id").references("users.id").notNullable();
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_user_profiles", (table) => {
		table.dropColumn("user_id");
	});
}

