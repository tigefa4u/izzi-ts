import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("dark_zone_collections", (table) => {
		table.increments("id").primary();
		table.string("user_tag").references("users.user_tag").notNullable();
		table.integer("rank_id").notNullable();
		table.string("rank").notNullable();
		table.integer("skin_id");
		table.boolean("is_tradable").defaultTo(true);
		table.jsonb("metadata");
		table.index([ "user_tag", "rank" ], "dz_tag_rank");
		table.index([ "user_tag" ]);
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("dark_zone_collections")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("dark_zone_collections");
}

