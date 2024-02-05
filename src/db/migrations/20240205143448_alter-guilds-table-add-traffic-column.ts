import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guilds", (table) => {
		table.integer("traffic").defaultTo(0);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guilds", (table) => {
		table.dropColumn("traffic");
	});
}

