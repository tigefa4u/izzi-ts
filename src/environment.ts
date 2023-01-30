export const DISCORD_BOT_PORT = process.env.DISCORD_BOT_PORT || 5000;
export const DB_USER = process.env.DB_USER;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_NAME = process.env.DB_NAME;
export const DB_HOST = process.env.DB_HOST;
export const DB_PORT = Number(process.env.DB_PORT);
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = Number(process.env.REDIS_PORT);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_USERNAME = process.env.REDIS_USERNAME;
export const DISCORD_TEST_BOT = process.env.DISCORD_TEST_BOT;
export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
export const IZZI_WEBSITE = process.env.IZZI_WEBSITE;
export const OFFICIAL_SERVER_LINK = process.env.OFFICIAL_SERVER_LINK;
export const LAVALINK_HOST = process.env.LAVALINK_HOST;
export const LAVALINK_PORT = process.env.LAVALINK_PORT;
export const LAVALINK_PASSWORD = process.env.LAVALINK_PASSWORD;
export const BOT_INVITE_LINK = process.env.BOT_INVITE_LINK;
export const OWNER_DISCORD_DISCRIMINATOR = process.env.OWNER_DISCORD_DISCRIMINATOR;
export const OWNER_DISCORDID = process.env.OWNER_DISCORDID;
export const BOT_VOTE_LINK = process.env.BOT_VOTE_LINK;
export const XENEX_VOTE_LINK = process.env.XENEX_VOTE_LINK;
export const AUTH_TOKEN = process.env.AUTH_TOKEN;
export const API_DOMAIN = process.env.API_DOMAIN;
export const TOTAL_SHARDS = Number(process.env.TOTAL_SHARDS); // total shards spawned on all machines together
export const SHARD_LIST = process.env.SHARD_LIST ? JSON.parse(process.env.SHARD_LIST) : undefined; // shard id list
export const PRIVACY_POLICY_URL = process.env.PRIVACY_POLICY_URL;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const BOT_PREFIX = "iz";
// export const BOT_PREFIX = "tt";
export const SLASH_COMMANDS_KEYBOARD_SHORTCUTS = process.env.SLASH_COMMANDS_KEYBOARD_SHORTCUTS;
export const GUIDE_DOCS = process.env.GUIDE_DOCS;
export const GCP_PROJECT_ID = "izzi-295412";
export const GCP_RESOURCE_PREFIX = process.env.GCP_RESOURCE_PREFIX || "unknown";
