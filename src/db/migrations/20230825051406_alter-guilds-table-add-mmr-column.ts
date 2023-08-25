import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guilds", (table) => {
		table.integer("match_making_rate").defaultTo(0);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guilds", (table) => {
		table.dropColumn("match_making_rate");
	});
}

