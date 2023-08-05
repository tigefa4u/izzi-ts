import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("wishlists", (table) => {
		table.boolean("is_xenex_card").defaultTo(false);
		table.boolean("is_referral_card").defaultTo(false);
		table.boolean("is_random").defaultTo(false);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("wishlists", (table) => {
		table.dropColumn("is_xenex_card");
		table.dropColumn("is_referral_card");
		table.dropColumn("is_random");
	});
}

