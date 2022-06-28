import connection from "db";

async function boot() {
	// const db = connection;
	// const uname = Array(200).fill("").map((_, i) => `asu${i + 1}`);
	// const alts = await db("users").whereIn("username", uname);
	// const ids = alts.map((a) => a.id);
	// await db("users").update({
	// 	is_banned: true,
	// 	is_active: false
	// }).whereIn("id", ids);
	// const banData = alts.map((a) => ({
	// 	user_tag: a.user_tag,
	// 	ban_reason: "Alternate account",
	// 	ban_length: 999
	// }));
	// await db("bans").insert(banData);
	console.log("done");
}
boot();