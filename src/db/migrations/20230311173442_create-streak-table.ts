import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTableIfNotExists("streaks", (table) => {
		table.increments("id").primary();
		table.string("user_tag").references("users.user_tag").notNullable();
		table.string("username").notNullable();
		table.integer("daily_quest_streaks").defaultTo(0);
		table.timestamp("daily_quest_updated_at");
		table.integer("vote_streak");
		table.timestamp("vote_streak_updated_at");
		table.jsonb("metadata");
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("streaks")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("streaks");
}

