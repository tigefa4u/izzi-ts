declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_BOT_PORT: string;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_NAME: string;
      DB_HOST: string;
      DB_PORT: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;
      NODE_ENV: "development" | "production";
      DISCORD_TEST_BOT: string;
      DISCORD_BOT_TOKEN: string;
      IZZI_WEBSITE: string;
      OFFICIAL_SERVER_LINK: string;
      LAVALINK_HOST: string;
      LAVALINK_PORT: string;
      LAVALINK_PASSWORD: string;
      BOT_INVITE_LINK: string;
      OWNER_DISCORD_DISCRIMINATOR: string;
      OWNER_DISCORDID: string;
      BOT_VOTE_LINK: string;
      AUTH_TOKEN: string;
      API_DOMAIN: string;
      TOTAL_SHARDS: string | "auto"; // total shards spawned on all machines together
      SHARD_LIST: string; // list of shard ids
      PRIVACY_POLICY: string;
    }
  }
}

export {};
