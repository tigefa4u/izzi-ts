import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTableIfNotExists("user_blacklists", (table) => {
		table.increments("id").primary();
		table.string("user_tag").unique().references("users.user_tag");
		table.string("username").notNullable();
		table.string("reason");
		table.integer("offense").defaultTo(0);
		table.jsonb("metadata");
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("user_blacklists")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("user_blacklists");
}

