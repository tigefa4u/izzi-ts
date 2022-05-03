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
	return await connection(tableName)
		.insert(data, "*")
		.then((res) => res[0]);
};

export const get = async (params: { id: number }): Promise<RaidProps[]> => {
	return await connection.select("*").from(tableName).where(params);
};

export const update = async (params: { id: number }, data: RaidUpdateProps) => {
	return await connection(tableName).where({ id: params.id }).update(data);
};

export const updateLobby = async ({
	raid_id,
	index,
	data,
}: {
  raid_id: number;
  index: number;
  data: RaidLobbyProps;
}) => {
	return 0;
	// deprecated
	// return connection(tableName)
	// 	.update({
	// 		lobby: connection.raw(
	// 			`jsonb_set(lobby, '{${index}}', '${JSON.stringify(data)}')`
	// 		),
	// 	})
	// 	.where({ id: raid_id });
};

export const refillEnergy = async (params: {
  data: RaidLobbyProps;
  id: number;
}) => {
	Object.keys(params.data).map(Number).forEach(async (id) => {
		await connection.raw(
			`update ${tableName} set lobby = jsonb_set(lobby, '${id}, energy', '${params.data[id].energy}', false) 
			where id = ${params.id}`
		);
	});
	return 1;
};

export const destroy = async (params: { id: number }) => {
	return await connection(tableName).where({ id: params.id }).del();
};

export const getAll = async (
	params?: Partial<RaidProps>
): Promise<RaidProps[]> => {
	const raidDisabled = await Cache.get("disable-raids");
	let query = connection(tableName).where({ is_event: raidDisabled ? true : false, });
	if (params && (params.is_start === true || params.is_start === false)) {
		query = query.where(`${tableName}.is_start`, params.is_start);
	}
	return query;
};

export const getRaidLobby = async (params: {
  user_id: number;
}): Promise<RaidProps[]> => {
	const db = connection;
	const query = await db
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
	const raidAlias = "raidalias";
	let queryStr = `${tableName}.*`;
	if (Object.keys(filters).length > 0) {
		queryStr = `distinct on (${tableName}.id) json_array_elements(${tableName}.raid_boss), ${tableName}.*`;
	}

	let query = db.select(db.raw(queryStr)).from(tableName);

	query = query
		.where(`${tableName}.is_start`, false)
		.where(`${tableName}.is_private`, false)
		.where(`${tableName}.is_event`, filters.isEvent ? filters.isEvent : false)
		.as(raidAlias);

	let aliasString = raidAlias;
	Object.keys(filters).forEach(async (key) => {
		if (![ "name", "rank", "type", "difficulty" ].includes(key)) return;

		const item = filters[key as keyof FilterProps];
		if (typeof item !== "object") return;
		const newalias = aliasString + "_" + key;
		query = db
			.select(db.raw(`${aliasString}.*`))
			.from(query)
			.whereRaw(
				`${
					key === "difficulty"
						? `${aliasString}.stats::json`
						: `${aliasString}.json_array_elements`
				} ->> '${key}' similar to '(${item?.map((i) => i).join("|")})%'`
			)
			.as(newalias);
		aliasString = newalias;
	});

	query = db
		.select(db.raw(`${aliasString}.*, count(*) over() as total_count`))
		.from(query);

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};
