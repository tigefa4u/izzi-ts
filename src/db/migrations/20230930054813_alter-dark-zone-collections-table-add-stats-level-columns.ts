import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_collections", (table) => {
		table.integer("character_id").references("characters.id");
		table.integer("exp").defaultTo(0);
		table.integer("r_exp").defaultTo(3000);
		table.integer("character_level").defaultTo(1);
		table.jsonb("stats").defaultTo("{}");
	});
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("dark_zone_collections", (table) => {
		table.dropColumn("stats");
		table.dropColumn("character_level");
		table.dropColumn("r_exp");
		table.dropColumn("exp");
		table.dropColumn("character_id");
	});
}

