import config from '../knexfile.js';
import knex from 'knex';

const db = knex(config);

const insert = async (table_name, records) => {
    return await db(table_name).insert(records);
}

const upsert = async (table_name, records, conflict_columns) => {
    if (!Array.isArray(records)) records = [records];
    const upsertFields = Object.keys(records[0]).map(column => '"' + column + '" = excluded."' + column + '"');
    const upsertQuery = /*sql*/`
        ${db(table_name).insert(records).toString()}
        ON CONFLICT (${conflict_columns.join(', ')}) DO UPDATE SET
        ${upsertFields.join(', ')}
    `.replace(/\?/g, "\\?")
    return await db.raw(upsertQuery);
}

const query = async (query, parameters) => {
    return (await db.raw(query, parameters)).rows;
}

export { insert, upsert, query }