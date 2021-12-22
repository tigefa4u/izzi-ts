import { Interaction, Message } from "discord.js";

export type IgnoreProps = "id" | "created_at" | "updated_at"

export type FilterProps = {
    name?: string | string[];
    rank?: string | string[];
    type?: string | string[];
    abilityname?: string | string[];
    series?: string;
}

export type EmbedFieldsProps = {
    name: string;
    value: string;
    inline?: boolean;
}

export type AuthorProps = Message["author"] | Interaction["user"]
