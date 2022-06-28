import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("ruins", (table) => {
		table.boolean("is_guild_floor").defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("ruins", (table) => {
		table.dropColumn("is_guild_floor");
	});
}
