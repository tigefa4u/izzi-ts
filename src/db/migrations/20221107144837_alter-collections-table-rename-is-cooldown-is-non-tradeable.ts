import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("collections", (table) => {
		table.boolean("is_tradable").defaultTo(true);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("collections", (table) => {
		table.dropColumn("is_tradable");
	});
}

