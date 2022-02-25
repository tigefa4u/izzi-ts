type T = "duke" | "ranger" | "zeke" | "hero" | "grand master"
export type DungeonLevelProps = {
    [key in T]: {
        rank: string;
        level: number;
        rank_id: number;
        name: string;
        equipItem?: boolean;
    }
}