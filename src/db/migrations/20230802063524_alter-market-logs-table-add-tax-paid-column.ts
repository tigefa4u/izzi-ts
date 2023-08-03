import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema
		.alterTable("market_logs", (table) => {
			table.integer("tax_paid").defaultTo(0).notNullable();
			table.string("user_tag").notNullable().defaultTo("");
		});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("market_logs", (table) => {
		table.dropColumn("tax_paid");
		table.dropColumn("user_tag");
	});
}
