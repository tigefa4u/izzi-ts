import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("referrals", (table) => {
		table.increments("id").primary();
		table.text("user_tag").notNullable().unique();
		table.text("referred_to").notNullable();
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("referrals")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("referrals");
}

