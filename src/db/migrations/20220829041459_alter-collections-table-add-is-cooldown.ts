import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("collections", (table) => {
		table.boolean("is_on_cooldown").defaultTo(false);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("collections", (table) => {
		table.dropColumn("is_on_cooldown");
	});
}

