import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guild_members", (table) => {
		table.integer("supporter_points").defaultTo(0);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guild_members", (table) => {
		table.dropColumn("supporter_points");
	});
}
