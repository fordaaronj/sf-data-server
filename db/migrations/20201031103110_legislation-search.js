const up = async (knex) => {
    await knex.schema.alterTable('legislation', t => {
        t.specificType('text_index', 'tsvector');
    });

    await knex.schema.alterTable('legislation_history', t => {
        t.index(['legislation_file_num'])
    });

    await knex.schema.alterTable('legislation_sponsors', t => {
        t.index(['legislation_file_num']);
        t.index(['person_id']);
    });

    await knex.schema.alterTable('votes', t => {
        t.index(['legislation_history_id']);
        t.index(['person_id']);
        t.index(['vote']);
    })

    await knex.raw(`
        CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
        ON legislation FOR EACH ROW EXECUTE PROCEDURE
        tsvector_update_trigger(text_index, 'pg_catalog.english', title, name);
    `);

    await knex.raw(`CREATE INDEX legislation_text_index_idx ON legislation USING GIN(text_index);`);

    await knex.raw(`
        CREATE FUNCTION search_legislation(search text) 
        RETURNS SETOF legislation AS $$ 
            
            SELECT * 
            FROM legislation 
            WHERE text_index @@ plainto_tsquery('english', search)

        $$ language sql stable;
    `)
}

const down = async (knex) => {
    await knex.raw(`DROP FUNCTION search_legislation`);

    await knex.raw(`DROP INDEX legislation_text_index_idx`);

    await knex.raw(`DROP TRIGGER tsvectorupdate ON legislation`);

    await knex.schema.alterTable('legislation_history', t => {
        t.dropIndex(['legislation_file_num'])
    });

    await knex.schema.alterTable('legislation_sponsors', t => {
        t.dropIndex(['legislation_file_num']);
        t.dropIndex(['person_id']);
    });

    await knex.schema.alterTable('votes', t => {
        t.dropIndex(['legislation_history_id']);
        t.dropIndex(['person_id']);
        t.dropIndex(['vote']);
    })

    await knex.schema.alterTable('legislation', t => {
        t.dropColumns(['text_index']);
    })
}

export { up, down }
