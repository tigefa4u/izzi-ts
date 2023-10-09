import { ExternalApiCreateProps, ExternalApiParamProps, ExternalApiProps } from "@customTypes/externalApi";
import connection from "db";
import { isEmptyObject } from "utility";

const tableName = "external_api_auth";

export const transformation = {
	id: { type: "uuid" },
	userTag: {
		type: "string",
		columnName: "user_tag",
		nullable: false
	},
	botId: {
		type: "string",
		columnName: "bot_id",
		nullable: false
	},
	secretKey: {
		type: "text",
		columnName: "secret_key",
		nullable: false
	},
	publicKey: {
		type: "text",
		columnName: "public_key",
		nullable: false
	},
	metadata: { type: "jsonb" },
	isDeleted: {
		type: "boolean",
		columnName: "is_deleted",
		defaultsTo: false
	}
};

export const get = (params: ExternalApiParamProps): Promise<ExternalApiProps[]> => {
	if (isEmptyObject(params)) {
		throw new Error("Params must not be empty");
	}
	const db = connection;
	return db(tableName).where(params).where({ is_deleted: false });
};

export const create = (data: ExternalApiCreateProps) => {
	return connection(tableName).insert(data);
};

export const update = (params: ExternalApiParamProps, data: Partial<ExternalApiProps>) => {
	return connection(tableName).where(params).update(data);
};