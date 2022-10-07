import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("wishlists", (table) => {
		table.increments("id").primary();
		table.integer("character_id").references("characters.id");
		table.integer("skin_id").references("card_skins.id").nullable();
		table.text("user_tag").notNullable();
		table.boolean("is_skin").defaultTo(false);
		table.jsonb("metadata");
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("wishlists")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("wishlists");
}

