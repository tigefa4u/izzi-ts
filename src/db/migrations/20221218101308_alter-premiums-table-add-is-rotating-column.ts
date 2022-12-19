import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("premiums", (table) => {
		table.boolean("is_rotating").defaultTo(false);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("premiums", (table) => {
		table.dropColumn("is_rotating");
	});
}

