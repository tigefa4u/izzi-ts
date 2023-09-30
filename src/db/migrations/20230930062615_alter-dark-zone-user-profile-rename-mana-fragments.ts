import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_user_profiles", (table) => {
		table.renameColumn("mana", "fragments");
		table.renameColumn("slots", "level");
		table.renameColumn("reached_max_zone_at", "reached_max_floor_at");
		table.dropColumns("zone", "max_zone", "max_zone_floor");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_user_profiles", (table) => {
		table.renameColumn("level", "slots");
		table.renameColumn("fragments", "mana");
		table.renameColumn("reached_max_floor_at", "reached_max_zone_at");
		table.integer("zone").defaultTo(1);
		table.integer("max_zone").defaultTo(1);
		table.integer("max_zone_floor").defaultTo(1);
	});
}

