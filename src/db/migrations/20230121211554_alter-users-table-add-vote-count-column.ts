import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.integer("vote_count").defaultTo(1);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.dropColumn("vote_count");
	});
}

