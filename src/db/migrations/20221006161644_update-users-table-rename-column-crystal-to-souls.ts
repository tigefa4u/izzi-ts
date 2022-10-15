import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.renameColumn("crystal", "souls");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.renameColumn("souls", "crystal");
	});
}

