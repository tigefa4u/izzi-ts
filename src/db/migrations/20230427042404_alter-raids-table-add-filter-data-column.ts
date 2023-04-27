import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("raids", (table) => {
		table.string("filter_data");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("raids", (table) => {
		table.dropColumn("filter_data");
	});
}

