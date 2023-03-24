import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("raids", (table) => {
		table.jsonb("stats").alter();
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("raids", (table) => {
		table.json("stats").alter();
	});
}

