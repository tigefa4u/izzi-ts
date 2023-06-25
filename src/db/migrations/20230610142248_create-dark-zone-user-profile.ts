import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("dark_zone_user_profiles", (table) => {
		table.increments("id").primary();
		table.string("user_tag").references("users.user_tag").notNullable().index();
		table.integer("mana").defaultTo(100).notNullable();
		table.integer("zone").defaultTo(1).notNullable();
		table.integer("max_zone").defaultTo(1).notNullable();
		table.integer("floor").defaultTo(1).notNullable();
		table.integer("max_floor").defaultTo(1).notNullable();
		table.integer("max_zone_floor").defaultTo(1).notNullable();
		table.timestamp("reached_max_zone_at");
		table.integer("slots").defaultTo(1);
		table.integer("exp").defaultTo(0);
		table.integer("r_exp").defaultTo(5000); // Exp required to unlock next slot in team
		table.integer("selected_team_id");
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("dark_zone_user_profiles")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("dark_zone_user_profiles");
}

