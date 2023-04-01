import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("world_boss_character_lists", (table) => {
		table.jsonb("voters").defaultTo([]);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("world_boss_character_lists", (table) => {
		table.dropColumn("voters");
	});
}

