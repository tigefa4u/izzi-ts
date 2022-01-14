export type CardSpawnProps = {
  id: number;
  channels: string[];
  guild_id: string;
};

export type CardSpawnCreateProps =
  | Omit<CardSpawnProps, "id" | "channels"> & { channels: string; }
  | (Omit<CardSpawnProps, "id" | "channels"> & { channels: string })[];
export type CardSpawnUpdateProps = Partial<
  Omit<CardSpawnProps, "id" | "channels"> & { channels: string }
>;
