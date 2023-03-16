import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema
		.createTableIfNotExists("quests", (table) => {
			table.increments("id").primary();
			table.string("name").notNullable();
			table.string("description").notNullable();
			table.enum("difficulty", [ "EASY", "MEDIUM", "HARD" ]).notNullable();
			table.jsonb("reward").notNullable();
			table.jsonb("criteria").notNullable();
			table.integer("min_level").notNullable();
			table.integer("max_level").notNullable();
			table.boolean("is_daily").defaultTo(false);
			table.boolean("is_special").defaultTo(false);
			table.integer("parent_id").references("quests.id").nullable();
			table.jsonb("metadata");
			table.string("type")
				// .enum("type", [
				// 	"RAID_CHALLENGE",
				// 	"RAID_CARRY",
				// 	"CARD_LEVELING",
				// 	"WEBPAGES",
				// 	"TRADING",
				// 	"MARKET",
				// 	"DUNGEON",
				// 	"PVP",
				// 	"WORLD_BOSS"
				// ])
				.notNullable();
			table.boolean("is_deleted").defaultTo(false);
			table.timestamps(true, true);
		})
		.then(() => knex.raw(knexfile.onUpdateTrigger("quests")));
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("quests");
}
