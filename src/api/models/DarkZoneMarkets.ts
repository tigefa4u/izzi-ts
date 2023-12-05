import { FilterProps } from "@customTypes";
import { DzMarketCreateProps, IDzMarketProps } from "@customTypes/market/darkZone";
import { PaginationProps } from "@customTypes/pagination";
import connection from "db";

const tableName = "dark_zone_markets";
const collections = "dark_zone_collections";
const cards = "cards";
const characters = "characters";
const abilities = "passives";

const colArr = [ "id", "user_tag", "price", "stats", "collection_id" ];

export const getMarketCollection = (params: {
    is_on_market: boolean;
    collection_id: number;
}): Promise<IDzMarketProps> => {
	const db = connection;
	const query = db.select(
		db.raw(`${tableName}.*, ${collections}.rank, ${characters}.name, ${abilities}.name as abilityname,
        ${tableName}.stats, ${characters}.type, ${collections}.character_level, ${collections}.character_id,
        ${cards}.filepath, ${cards}.metadata, ${collections}.rank_id`)
	)
		.from(tableName)
		.innerJoin(collections, `${tableName}.collection_id`, `${collections}.id`)
		.innerJoin(characters, `${collections}.character_id`, `${characters}.id`)
		.innerJoin(abilities, `${characters}.passive_id`, `${abilities}.id`)
		.innerJoin(cards, `${characters}.id`, `${cards}.character_id`)
		.where(`${collections}.is_on_market`, params.is_on_market)
		.where(`${tableName}.collection_id`, params.collection_id)
		.then((res) => res[0]);

	return query;
};

export const create = async (data: DzMarketCreateProps) => connection(tableName).insert(data);

export const del = async (id: number) => connection(tableName).where({ id }).del();

export const getAll = async (
	params: Pick<FilterProps, "name" | "rank" | "abilityname" | "type" | "collection_ids" | "isExactMatch" | "series">,
	pagination: PaginationProps = {
		limit: 10,
		offset: 0,
	}
): Promise<IDzMarketProps[]> => {
	const db = connection;
	const alias = "dzmarketalias";
	let query = db
		.select(
			db.raw(`${tableName}.*, ${collections}.rank, ${characters}.name, ${abilities}.name as abilityname,
			${characters}.type, ${collections}.character_level, ${collections}.character_id,
			${collections}.rank_id`)
		)
		.from(tableName)
		.innerJoin(collections, `${tableName}.collection_id`, `${collections}.id`)
		.innerJoin(characters, `${collections}.character_id`, `${characters}.id`)
		.innerJoin(abilities, `${characters}.passive_id`, `${abilities}.id`)
		.innerJoin(cards, `${cards}.character_id`, `${characters}.id`)
		.where(`${cards}.rank`, "silver")
		.as(alias);

	if (typeof params.series === "string") {
		query = query.where(`${cards}.series`, "ilike", `%${params.series}%`);
	} else if (typeof params.series === "object") {
		query = query.where(
			`${cards}.series`,
			"~*",
			`(${params.series.join("|")}).*`
		);
	}
	if (typeof params.name === "string") {
		query = query.where(`${characters}.name`, "ilike", `%${params.name}%`);
	} else if (typeof params.name === "object") {
		if (params.isExactMatch) {
			query = query.whereIn(`${characters}.name`, params.name);
		} else {
			query = query.where(
				`${characters}.name`,
				"~*",
				`(${params.name.join("|")}).*`
			);
		}
	}
	if (typeof params.type === "string") {
		query = query.where(`${characters}.type`, "ilike", `%${params.type}%`);
	} else if (typeof params.type === "object") {
		query = query.where(
			`${characters}.type`,
			"~*",
			`(${params.type.join("|")}).*`
		);
	}
	if (typeof params.abilityname === "string") {
		query = query.where(
			`${abilities}.name`,
			"ilike",
			`%${params.abilityname}%`
		);
	} else if (typeof params.abilityname === "object") {
		query = query.where(
			`${abilities}.name`,
			"~*",
			`(${params.abilityname.join("|")}).*`
		);
	}
	if (typeof params.rank === "string") {
		query = query.where(`${collections}.rank`, "ilike", `%${params.rank}%`);
	} else if (typeof params.rank === "object") {
		query = query.where(
			`${collections}.rank`,
			"~*",
			`(${params.rank.join("|")}).*`
		);
	}

	if (typeof params.collection_ids === "object") {
		query = query.whereIn(`${tableName}.collection_id`, params.collection_ids);
	}

	query = db
		.select(db.raw(`${alias}.*, count(*) over() as total_count`))
		.from(query)
		.orderBy(`${alias}.price`, "asc");

	query = query.limit(pagination.limit).offset(pagination.offset);

	return query;
};
