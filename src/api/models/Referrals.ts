import { PaginationProps } from "@customTypes/pagination";
import {
	ReferralCreateProps,
	ReferralParamProps,
	ReferralProps,
} from "@customTypes/referrals";
import connection from "db";

const tableName = "referrals";
const users = "users";
export const transformation = {
	id: {
		type: "number",
		autoIncrement: true,
	},
	metadata: { type: "jsonb" },
	userTag: {
		columnName: "user_tag",
		type: "string",
	},
	referredTo: {
		type: "string",
		columnaName: "referred_to",
	},
	isDeleted: {
		type: "boolean",
		columnName: "is_deleted",
	},
};

export const getAll = async (
	params: { referred_to: string },
	pagination: PaginationProps
): Promise<ReferralProps[]> => {
	const db = connection;
	const query = db
		.select(
			db.raw(
				`${tableName}.*, ${users}.username, count(*) over() as total_count`
			)
		)
		.from(tableName)
		.leftJoin(users, `${tableName}.user_tag`, `${users}.user_tag`)
		.where({ referred_to: params.referred_to, })
		.where(`${tableName}.is_deleted`, false)
		.limit(pagination.limit)
		.offset(pagination.offset);

	return query;
};

export const get = async (
	params: Partial<ReferralParamProps> 
): Promise<ReferralProps[]> => {
	const db = connection;
	const userTag = params.user_tag;
	delete params.user_tag;
	let query = db
		.select(db.raw(`${tableName}.*, ${users}.username`))
		.from(tableName)
		.leftJoin(users, `${tableName}.user_tag`, `${users}.user_tag`)
		.where(params)
		.where(`${tableName}.is_deleted`, false);

	if (userTag) {
		query = query.where(`${tableName}.user_tag`, userTag);
	}
	return query;
};

export const create = async (data: ReferralCreateProps) => {
	return connection(tableName).insert(data);
};

export const update = async (
	params: Partial<ReferralParamProps>,
	data: Partial<ReferralCreateProps>
) => {
	return connection(tableName).where(params).update(data);
};
