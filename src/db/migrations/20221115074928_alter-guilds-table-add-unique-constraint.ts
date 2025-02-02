import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guilds", (table) => {
		table.unique([ "guild_id" ]);
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("guilds", (table) => {
		table.dropUnique([ "guild_id" ]);
	});
}

