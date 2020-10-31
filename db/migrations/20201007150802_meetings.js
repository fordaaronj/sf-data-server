const up = async (knex) => {
    await knex.schema.createTable('meetings', t => {
        t.increments('id');
        t.text('committee').notNull().index();
        t.timestamp('time').notNull().index();
        t.text('location');
        t.text('type').index();
        t.text('details_url')
        t.text('agenda_url')
        t.text('minutes_url');
        t.text('video_url');
        t.text('audio_url');
        t.text('transcript_url');

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull()

        t.unique(['committee', 'time', 'type']);
    })
}

const down = async (knex) => {
    await knex.schema.dropTable('meetings')
}

export { up, down }
