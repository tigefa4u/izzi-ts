import { FilterProps } from "@customTypes";
import { PaginationProps } from "@customTypes/pagination";
import {
	RaidCreateProps,
	RaidLobbyProps,
	RaidProps,
	RaidUpdateProps,
} from "@customTypes/raids";
import Cache from "cache";
import connection from "db";

const tableName = "raids";
const users = "users";

export const transformation = {
	id: {
		type: "integer",
		autoIncrements: true,
	},
	characterRank: {
		type: "string",
		columnName: "character_rank",
	},
	characterId: {
		columnName: "character_id",
		ref: "characters",
		type: "integer",
	},
	characterLevel: {
		columnName: "character_level",
		type: "integer",
	},
	lobby: { type: "json" },
	loot: { type: "json" },
	stats: { type: "json" },
	raidBoss: {
		type: "json",
		columnName: "raid_boss",
	},
	isStart: {
		type: "boolean",
		columnName: "is_start",
		default: false,
	},
	isPrivate: {
		type: "boolean",
		columnName: "is_private",
		default: false,
	},
	isEvent: {
		type: "boolean",
		columnName: "is_event",
		default: false,
	},
	isWorldBoss: {
		type: "boolean",
		columnName: "is_world_boss",
		default: false
	},
	filterData: {
		type: "string",
		columnName: "filter_data"
		// This column contains all boss names, ranks, difficulty, type
		// to make query easier and straightforward
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
export const create = async (data: RaidCreateProps): Promise<RaidProps> => {
	return connection(tableName)
		.insert(data, "*")
		.then((res) => res[0]);
};

export const get = async (params: { id: number }): Promise<RaidProps[]> => {
	return connection.select("*").from(tableName).where(params)
		.where({ is_world_boss: false });
};

export const update = async (params: { id: number }, data: RaidUpdateProps) => {
	return connection(tableName).where({ id: params.id }).update(data);
};

export const updateLobby = async ({
	raid_id,
	user_id,
	data,
}: {
  raid_id: number;
  user_id: number;
  data: RaidLobbyProps[0];
}) => {
	return connection(tableName).where({ id: raid_id }).update({
		lobby: connection.raw(`
		jsonb_set(??, '{${user_id}}', ?)`, [ "lobby", JSON.stringify(data) ])
	});
};

export const refillEnergy = async (params: {
  data: RaidLobbyProps;
  id: number;
}) => {
	return Promise.all(
		Object.keys(params.data).map(async (id) => {
			await connection(tableName).where({ id: params.id }).update({
				lobby: connection.raw(`
				jsonb_set(??, '{${Number(id)}, energy}', ?)`, [ "lobby", params.data[Number(id)].energy ])
			});
		})
	);
};

export const destroy = async (params: { id: number | number[]; }) => {
	let query = connection(tableName).del();
	if (typeof params.id === "number") {
		query = query.where({ id: params.id });
	} else {
		query = query.whereIn("id", params.id);
	}
	return query;
};

export const getAll = async (
	params?: Partial<RaidProps>
): Promise<RaidProps[]> => {
	const raidDisabled = await Cache.get("disable-raids");
	let query = connection(tableName).where({ is_event: raidDisabled ? true : false, })
		.where({ is_world_boss: false });
	if (params && (params.is_start === true || params.is_start === false)) {
		query = query.where(`${tableName}.is_start`, params.is_start);
	}
	return query;
};

export const getRaidLobby = async (params: {
  user_id: number;
}): Promise<RaidProps[]> => {
	const db = connection;
	const query = db
		.select(
			db.raw(`${tableName}.*, lobby->'${params.user_id}' as lobby_member`)
		)
		.from(tableName)
		.whereRaw(
			`(${tableName}.lobby->'${params.user_id}'->'user_id')::int = ${params.user_id}`
		);

	return query;
};

export const getRaids = (
	filters: FilterProps,
	pagination: PaginationProps = {
		limit: 10,
		offset: 0,
	}
): Promise<RaidProps[]> => {
	const db = connection;

	let query = db.select(db.raw(`${tableName}.*, count(1) over() as total_count`))
		.from(tableName)
		.where(`${tableName}.is_start`, false)
		.where(`${tableName}.is_private`, false)
		.where(`${tableName}.is_event`, filters.isEvent ? filters.isEvent : false)
		.where(`${tableName}.is_world_boss`, false)
		.orderBy(`${tableName}.id`, "desc");

	// All the filter data is concatinated into one column for easy query
	if (Object.keys(filters).length > 0) {
		Object.keys(filters).forEach((key) => {
			if (![ "name", "rank", "type" ].includes(key)) return;
			const item = filters[key as keyof FilterProps];
			if (typeof item === "object") {
				query = query.where(`${tableName}.filter_data`, "~*", `${item.join("|")}.*`);
			}
		});
	}
	if (filters.difficulty && typeof filters.difficulty === "object") {
		const difficulty = filters.difficulty[0];
		query = query.whereRaw(`${tableName}.stats ->> 'difficulty' ilike '%${difficulty}%'`);
	}

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};

export const getWorldBoss = async (params?: { is_start: boolean; }): Promise<RaidProps> => {
	let query = connection(tableName).where({ is_world_boss: true, });
	
	if (typeof params?.is_start === "boolean") {
		query = query.where({ is_start: params.is_start });
	}
	return query.then((res) => res[0]);
};