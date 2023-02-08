import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cards", (table) => {
		table.enum("group_id", [ 1, 2, 3 ]);
		table.enum("group_with", [ 1, 2, 3 ]);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cards", (table) => {
		table.dropColumn("group_id");
		table.dropColumn("group_with");
	});
}

