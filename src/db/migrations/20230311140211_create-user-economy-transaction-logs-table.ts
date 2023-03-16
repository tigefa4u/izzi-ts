import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTableIfNotExists("user_economy_transaction_logs", (table) => {
		table.increments("id").primary();
		table.string("user_tag").notNullable().references("users.user_tag");
		table.string("username").notNullable();
		table.integer("izzi_points").defaultTo(0);
		table.integer("shards").defaultTo(0);
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("user_economy_transaction_logs")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("user_economy_transaction_logs");
}

