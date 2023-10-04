import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.timestamp("last_active_at");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.dropColumn("last_active_at");
	});
}

