import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("quests", (table) => {
		table.renameColumn("is_special", "is_premium");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("quests", (table) => {
		table.renameColumn("is_premium", "is_special");
	});
}

