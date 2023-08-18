import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("collections", (table) => {
		table.integer("card_count").defaultTo(1);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("collections", (table) => {
		table.dropColumn("card_count");
	});
}

