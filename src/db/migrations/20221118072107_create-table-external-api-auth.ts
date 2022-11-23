import knexfile from "../knexfile";
import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTableIfNotExists("external_api_auth", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("(gen_random_uuid())"));
		table.string("user_tag").notNullable();
		table.string("bot_id").notNullable();
		table.text("secret_key").notNullable();
		table.text("public_key").notNullable();
		table.jsonb("metadata");
		table.boolean("is_deleted").defaultTo(false);
		table.timestamps(true, true);
	}).then(() => knex.raw(knexfile.onUpdateTrigger("external_api_auth")));
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("external_api_auth");
}

