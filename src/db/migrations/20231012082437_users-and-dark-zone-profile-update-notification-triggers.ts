import { Knex } from "knex";
import knexfile from "../knexfile";

export async function up(knex: Knex): Promise<void> {
	await Promise.all([
		knex.schema.raw(`${knexfile.onUpdateNotificationTrigger("users")}`),
		knex.schema.raw(`${knexfile.onUpdateNotificationTrigger("dark_zone_user_profiles")}`)
	]);
	return;
}


export async function down(knex: Knex): Promise<void> {
	await Promise.all([
		knex.schema.raw(`${knexfile.onUpdateNotificationDropTrigger("users")}`),
		knex.schema.raw(`${knexfile.onUpdateNotificationDropTrigger("dark_zone_user_profiles")}`)
	]);
	return;
}

