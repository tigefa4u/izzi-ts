import { CollectionCardInfoProps } from "@customTypes/collections";

export type TeamMeta = { collection_id: number | null; position: number; };

export type TeamProps = {
    id: number;
    user_id: number;
    name: string;
    metadata: TeamMeta[];
}

export type TeamUpdateParams = { id: number; user_id: number; }

export type TeamCreateProps = Omit<TeamProps, "id" | "metadata"> & {
    metadata: string;
}

export type TeamUpdateData = {
    name: string;
    metadata: string;
}

export type PrepareTotalOverallStats = {
    collections: CollectionCardInfoProps[];
    isBattle: boolean;
}