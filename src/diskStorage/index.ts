import Sqlite from "better-sqlite3";

export default class DiskStorage<T extends object> {
	db;
	tableName;
	constructor(dbname = "cache", tableName: string) {
		this.db = new Sqlite(`${dbname}.sqlite`);
		this.tableName = tableName;
	}
	public createTable(cols: string[]) {
		let data;
		try {
			data = this.db.prepare(`select id from ${this.tableName} limit 1`);
			console.log(`${this.tableName} already exists`);
		} catch (err) {
			//
		}
		if (!data) {
			console.log(`Creating new disk storage table: ${this.tableName}`);
			this.db.exec(
				`create table if not exists ${this.tableName} (${cols.join(",")})`
			);
		}
		return true;
	}
	public getAll() {
		return this.db.prepare(`select * from ${this.tableName}`).all();
	}
	public getById(id: string) {
		return this.db
			.prepare(`select * from ${this.tableName} where id = ?`)
			.get(id);
	}
	public insert(data: T) {
		const cols = Object.keys(data);
		return this.db
			.prepare(
				`insert into ${this.tableName} (${cols.join(",")}) values(${cols.map(
					(i) => `@${i}`
				)})`
			)
			.run(data);
	}
	public deleteById(id: string) {
		return this.db
			.prepare(`delete from ${this.tableName} where id = ?`)
			.run(id);
	}
	public flashall() {
		return this.db.prepare(`delete from ${this.tableName}`).run();
	}
	public dropTable() {
		return this.db.exec(`drop table ${this.tableName}`);
	}
}
