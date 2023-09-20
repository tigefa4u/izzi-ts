import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("card_and_skin_approvals", (table) => {
		table.enum("status", [ "UPLOADING", "SUBMITTED", "REJECTED", "APPROVED" ]).defaultTo("UPLOADING");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("card_and_skin_approvals", (table) => {
		table.dropColumn("status");
	});
}

