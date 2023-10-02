import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cards", (table) => {
		table.jsonb("card_type_metadata");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cards", (table) => {
		table.dropColumn("card_type_metadata");
	});
}

