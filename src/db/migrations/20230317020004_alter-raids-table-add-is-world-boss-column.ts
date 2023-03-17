import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("raids", (table) => {
		table.boolean("is_world_boss").defaultTo(false);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("raids", (table) => {
		table.dropColumn("is_world_boss");
	});
}

