import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("collections", (table) => {
		table.jsonb("metadata").defaultTo("{}");
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("collections", (table) => {
		table.dropColumn("metadata");
	});
}
