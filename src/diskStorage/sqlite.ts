import Sqlite from "better-sqlite3";

const defaultDB = new Sqlite("cache.sqlite");

export const createDBTable = (tableName: string, cols: string[], db = defaultDB) => {
	return db.exec(`create table if not exists ${tableName} (${cols.map((i) => i)})`);
};

export const getFromDb = (tableName: string, tag: string, db = defaultDB) => {
	return db.prepare(`select * from ${tableName} where tag = ?`).get(tag);
};

export const updateDb = <T>(tableName: string, tag: string, data: T, key: string, db = defaultDB) => {
	return db.prepare(`update ${tableName} set ${key} = @data where tag = @tag`)
		.run({
			data: JSON.stringify(data),
			tag
		});
};

export const insertToDB = <T>(tableName: string, tag: string, key: string, data: T, db = defaultDB) => {
	return db.prepare(`insert into ${tableName} (tag, ${key}) values(@tag, @data)`)
		.run({
			tag,
			data: JSON.stringify(data)
		});
};

export const delFromDb = (tableName: string, tag: string, db = defaultDB) => {
	return db.prepare(`delete from ${tableName} where tag = ?`).run(tag);
};

export const dropDbTable = (tableName: string, db = defaultDB) => {
	return db.exec(`drop table ${tableName}`);
};

export const insertLogs = <T extends {}>(tableName: string, data: T, db = defaultDB) => {
	const cols = Object.keys(data);
	return db.prepare(`insert into ${tableName} (${cols.map((i) => i)})
        values (${cols.map((i) => `@${i}`)})`)
		.run(data);
};

export const getAllFromDB = (tableName: string, db = defaultDB) => {
	return db.prepare(`select * from ${tableName}`).all();
};