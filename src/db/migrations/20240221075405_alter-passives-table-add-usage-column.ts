import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("passives", (table) => {
		table.integer("usage").defaultTo(0);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("passives", (table) => {
		table.dropColumn("usage");
	});
}

