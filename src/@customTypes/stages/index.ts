export type StageProps = {
	id: number;
	location_id: number;
	floor: number;
	level: string;
	card_id: string;
	created_at: string;
	updated_at: string;
}

export type NormalizeFloorProps = {
    floors: number[];
    zone: number;
}