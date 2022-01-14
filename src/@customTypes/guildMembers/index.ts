import { UserProps } from "@customTypes/users";

export type GuildMemberProps = {
    id: number;
    guild_id: number;
    user_id: number;
    is_leader: boolean;
    is_vice_leader: boolean;
    donation: number;
    max_donation: number;
};

export type GuildMemberCreateProps = Omit<GuildMemberProps, "id">;
export type GuildMemberUpdateProps = Partial<GuildMemberCreateProps>;

export type GuildMemberResponseProps = GuildMemberProps & Pick<UserProps, "user_tag" | "username" | "level">;