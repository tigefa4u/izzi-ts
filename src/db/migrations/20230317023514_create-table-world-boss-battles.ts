import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("world_boss_battles", (table) => {
		table.increments("id").primary();
		table.string("user_tag").references("users.user_tag").notNullable();
		table.integer("character_id").references("characters.id");
		table.integer("damage_dealt").defaultTo(0).notNullable();
		table.jsonb("boss_stats").notNullable();
		table.jsonb("loot");
		table.jsonb("metadata");
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("world_boss_battles")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("world_boss_battles");
}

