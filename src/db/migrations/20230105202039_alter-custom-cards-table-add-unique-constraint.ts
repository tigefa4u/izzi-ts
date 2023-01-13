import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("custom_cards", (table) => {
		table.unique([ "user_tag" ]);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("custom_cards", (table) => {
		table.dropUnique([ "user_tag" ]);
	});
}

