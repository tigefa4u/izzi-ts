import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.integer("game_points").defaultTo(0);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.dropColumn("game_points");
	});
}

