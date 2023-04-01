import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("world_boss_character_lists", (table) => {
		table.increments("id").primary();
		table.string("name").notNullable();
		table.string("series").notNullable();
		table.string("filepath").notNullable();
		table.integer("votes").defaultTo(0);
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("world_boss_character_lists")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("world_boss_character_lists");
}

