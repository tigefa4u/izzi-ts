import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	knex.schema.alterTable("world_boss_battles", (table) => {
		table.index("user_tag");
	});
	knex.schema.alterTable("user_quests", (table) => {
		table.index([ "user_tag", "quest_id" ], "uq_id");
	});
	return;
}


export async function down(knex: Knex): Promise<void> {
	knex.schema.alterTable("world_boss_battles", (table) => {
		table.dropIndex("user_tag");
	});
	knex.schema.alterTable("user_quests", (table) => {
		table.dropIndex([ "user_tag", "quest_id" ], "uq_id");
	});
	return;
}

