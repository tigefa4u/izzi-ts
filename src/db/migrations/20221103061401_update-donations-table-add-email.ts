import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("donations", (table) => {
		table.string("email");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("donations", (table) => {
		table.dropColumn("email");
	});
}

