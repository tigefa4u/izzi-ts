import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable("users", (table) => {
        table.integer("monthly_votes").defaultTo(0);
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable("users", (table) => {
        table.dropColumn("monthly_votes")
    })
}

