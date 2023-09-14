import { CharacterDetailsProps } from "@customTypes/characters";

export type CustomServerCardProps = {
  id: number;
  series: string;
  character_id: number;
  guild_ids: string[]; // jsonb
  metadata?: {
    serverInviteLinks?: string;
  };
  submitted_by: string;
  is_deleted: boolean;
};

export type CustomServerCardAndCharacterProps = CustomServerCardProps &
  Pick<CharacterDetailsProps, "name" | "type" | "abilityname" | "stats">;
