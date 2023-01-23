import connection from "db";
import { Knex } from "knex";

export default (cb: (trx: Knex.Transaction) => void) => connection.transaction((trx) => cb(trx));