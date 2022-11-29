import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guilds", (table) => {
		table.integer("max_admin_slots").defaultTo(1);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guilds", (table) => {
		table.dropColumn("max_admin_slots");
	});
}

