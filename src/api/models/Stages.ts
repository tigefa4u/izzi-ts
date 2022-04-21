import { BattleStageProps, StageProps } from "@customTypes/stages";
import connection from "db";

const tableName = "stages";
const cards = "cards";
const zones = "ruins";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	locationId: {
		type: "number",
		ref: "ruins",
		columnName: "location_id",
	},
	floor: { type: "number" },
	level: { type: "number" },
	cardId: {
		type: "number",
		ref: "cards",
		columnName: "card_id",
	},
	createdAt: {
		type: "timestamp",
		columnName: "created_at",
	},
	updatedAt: {
		type: "timestamp",
		columnName: "updated_at",
	},
};

export const getFloorsBycharacterId: (params: {
  character_id: number;
}) => Promise<StageProps[]> = async function (params) {
	const db = connection;
	const query = db
		.select("*")
		.from(tableName)
		.innerJoin(cards, `${tableName}.card_id`, `${cards}.id`)
		.where(`${cards}.character_id`, params.character_id)
		.orderBy(`${tableName}.location_id`, "asc")
		.orderBy(`${tableName}.floor`, "asc");

	return query;
};

export const getStageForBattle = async (location_id: number, floor: number): Promise<BattleStageProps> => {
	const db = connection;
	const query = db
		.select(db.raw(`${tableName}.*, ${cards}.rank, ${cards}.character_id, ${zones}.max_floor, ${zones}.filepath`))
		.from(tableName)
		.innerJoin(cards, `${tableName}.card_id`, `${cards}.id`)
		.innerJoin(zones, `${tableName}.location_id`, `${zones}.location_id`)
		.where(`${tableName}.location_id`, location_id)
		.andWhere(`${tableName}.floor`, floor)
		.then((res) => res[0]);

	return query;
};