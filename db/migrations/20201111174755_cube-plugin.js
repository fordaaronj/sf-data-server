const up = async (knex) => {
    await knex.raw(`CREATE EXTENSION IF NOT EXISTS cube;`);
    await knex.raw(`CREATE EXTENSION IF NOT EXISTS earthdistance`);
} 

const down = async (knex) => {
    await knex.raw(`DROP EXTENSION IF EXISTS earthdistance;`);
    await knex.raw(`DROP EXTENSION IF EXISTS cube;`);
}

export { up, down }
