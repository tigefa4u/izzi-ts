import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("quests", (table) => {
		table.boolean("is_weekly").defaultTo(false);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("quests", (table) => {
		table.dropColumn("is_weekly");
	});
}

