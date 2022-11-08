import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cards", (table) => {
		table.boolean("is_referral_card").defaultTo(false);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cards", (table) => {
		table.dropColumn("is_referral_card");
	});
}

