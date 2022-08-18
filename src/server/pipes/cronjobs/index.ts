import connection from "db";
import "../../../module";

const knex = connection;

export async function init(params: {
  is_premium: boolean;
  is_mini_premium: boolean;
}) {
	await knex.raw(
		`update users set raid_pass = raid_pass + 1, raid_permit_refilled_at = now() 
        where is_banned = false and is_premium = ${params.is_premium} ${
	params.is_premium ? "or" : "and"
} is_mini_premium = ${params.is_mini_premium} 
		and raid_pass < max_raid_pass`
	);
}
