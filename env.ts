const config = {
    DISCORD_BOT_PORT: process.env.DISCORD_BOT_PORT || 5000,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: Number(process.env.DB_PORT),
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: Number(process.env.REDIS_PORT),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
	DISCORD_TEST_BOT: process.env.DISCORD_TEST_BOT,
	DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
	IZZI_WEBSITE: process.env.IZZI_WEBSITE,
	OFFICIAL_SERVER_LINK: process.env.OFFICIAL_SERVER_LINK,
	LAVALINK_HOST: process.env.LAVALINK_HOST,
	LAVALINK_PORT: process.env.LAVALINK_PORT,
	LAVALINK_PASSWORD: process.env.LAVALINK_PASSWORD,
	BOT_INVITE_LINK: process.env.BOT_INVITE_LINK,
	OWNER_DISCORD_DISCRIMINATOR: process.env.OWNER_DISCORD_DISCRIMINATOR,
	OWNER_DISCORDID: process.env.OWNER_DISCORDID,
	BOT_VOTE_LINK: process.env.BOT_VOTE_LINK,
	AUTH_TOKEN: process.env.AUTH_TOKEN,
	API_DOMAIN: process.env.API_DOMAIN,
	TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS) || "auto", // total shards spawned on all machines together
	SHARD_LIST: process.env.SHARD_LIST ? JSON.parse(process.env.SHARD_LIST) : undefined, // shard id list
};

export default config;