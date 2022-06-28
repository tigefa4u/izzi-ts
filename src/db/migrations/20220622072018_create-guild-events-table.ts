import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("guild_events", (table) => {
		table.increments("id").primary();
		table.text("name").notNullable();
		table.text("guild_id", "varchar").notNullable();
		table.text("description", "varchar");
		table.integer("duration").notNullable();
		table.timestamp("start_date").defaultTo(knex.fn.now());
		table.timestamp("end_date").notNullable();
		table.jsonb("guild_boss");
		table.jsonb("loot").defaultTo("{}");
		table.jsonb("lobby").defaultTo("{}");
		table.jsonb("metadata");
		table.boolean("is_guild_floor").defaultTo(false);
		table.boolean("is_start").defaultTo(false);
		table.boolean("has_ended").defaultTo(false);
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("guild_events")));
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("guild_events");
}
