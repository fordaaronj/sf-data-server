const up = async (knex) => {
    await knex.schema.createTable('transcripts', t => {
        t.increments('id');

        t.integer('meeting_id').references('meetings.id').notNull().index();
        t.integer('line_num').notNull().index();
        t.text('speaker_title').index();
        t.text('speaker_name').index();
        t.time('start_time').notNull().index()
        t.text('text').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull()

        t.unique(['meeting_id', 'line_num']);
        t.specificType('text_index', 'tsvector');

    })

    await knex.raw(`
        CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
        ON transcripts FOR EACH ROW EXECUTE PROCEDURE
        tsvector_update_trigger(text_index, 'pg_catalog.english', speaker_title, speaker_name, text);
    `)
    
    await knex.raw(`CREATE INDEX text_index_idx ON transcripts USING GIN(text_index);`)
}

const down = async (knex) => {
    await knex.schema.dropTable('transcripts')
}

export { up, down }
