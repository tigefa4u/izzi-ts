import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cards", (table) => {
		table.boolean("is_world_boss").defaultTo(false);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cards", (table) => {
		table.dropColumn("is_world_boss");
	});
}

