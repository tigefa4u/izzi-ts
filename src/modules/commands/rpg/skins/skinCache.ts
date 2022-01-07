import {
	createDBTable, delFromDb, getFromDb, insertToDB, updateDb 
} from "diskStorage/sqlite";
import loggers from "loggers";

const tableName = "skin_cache";
export const setSkinArr = <T>(tag: string, data: T[]) => {
	try {
		createDBTable(tableName, [ "tag", "skin_arr" ]);
		const row = getFromDb(tableName, tag);
		if (row) {
			updateDb(tableName, tag, data, "skin_arr");
		} else {
			insertToDB(tableName, tag, "skin_arr", data);
		}
	} catch (err) {
		return;
	}
};

export const getSkinArr = (tag: string): any => {
	try {
		const row = getFromDb(tableName, tag);
		if (row) {
			loggers.info("disk cache hit for user skin author id: " + tag);
			return JSON.parse(row.skin_arr);
		}
		return;
	} catch (err) {
		loggers.info("disk cache miss for user skin author id: " + tag);
		return;
	}
};

export const delSkinArr = (tag: string) => {
	return delFromDb(tableName, tag);
};