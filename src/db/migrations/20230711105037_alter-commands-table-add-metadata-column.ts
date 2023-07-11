import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("commands", (table) => {
		table.jsonb("metadata");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("commands", (table) => {
		table.dropColumn("metadata");
	});
}

