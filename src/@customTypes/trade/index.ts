export type TradeQueueProps = {
    [key: string]: {
        username: string;
        hasConfirmed: boolean;
        queue: {
            id: number;
            user_id: number;
            rank: string;
        }[];
        gold: number;
    }
}
