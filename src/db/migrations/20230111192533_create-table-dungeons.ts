import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTableIfNotExists("dungeons", (table) => {
		table.increments("id").primary();
		table.string("user_tag").unique().references("users.user_tag");
		table.string("username").notNullable();
		table.jsonb("team");
		table.jsonb("metadata");
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("dungeons")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("dungeons");
}

