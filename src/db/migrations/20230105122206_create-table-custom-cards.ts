import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTableIfNotExists("custom_cards", (table) => {
		table.increments("id").primary();
		table.string("user_tag").notNullable().references("users.user_tag");
		table.integer("permissions").defaultTo(0);
		table.jsonb("info");
		table.jsonb("cards");
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("custom_cards")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("custom_cards");
}

