import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.boolean("is_mini_premium").defaultTo(false);
		table.integer("mini_premium_days_left").defaultTo(0);
		table.timestamp("mini_premium_since");
		table.integer("mini_premium_days").defaultTo(0);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("users", (table) => {
		table.dropColumn("is_mini_premium");
		table.dropColumn("mini_premium_days_left");
		table.dropColumn("mini_premium_since");
		table.dropColumn("mini_premium_days");
	});
}

