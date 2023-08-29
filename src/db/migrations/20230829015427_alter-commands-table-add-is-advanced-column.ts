import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("commands", (table) => {
		table.boolean("is_beginner").defaultTo(false);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("commands", (table) => {
		table.dropColumn("is_beginner");
	});
}

