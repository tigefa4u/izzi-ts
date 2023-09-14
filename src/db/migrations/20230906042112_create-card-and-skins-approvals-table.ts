import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("card_and_skin_approvals", (table) => {
		table.increments("id").primary();
		table.string("name"); // series name
		table.string("guild_id");
		table.boolean("is_skin").defaultTo(false);
		table.string("submitted_by").notNullable();
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("card_and_skin_approvals")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("card_and_skin_approvals");
}

