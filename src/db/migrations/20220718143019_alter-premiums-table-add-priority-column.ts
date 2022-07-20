import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("premiums", (table) => {
		table.integer("priority").defaultTo(1);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("premiums", (table) => {
		table.dropColumn("priority");
	});
}

