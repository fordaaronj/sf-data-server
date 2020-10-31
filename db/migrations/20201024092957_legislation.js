const up = async (knex) => {
    await knex.schema.createTable('legislation', t => {
        t.increments('id');
        t.text('file_num').notNull().unique();
        t.text('type').index();
        t.text('status').index();
        t.date('introduced_on').index()
        t.date('finalized_on').index();
        t.text('title');
        t.text('details_url').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull()
    })
}

const down = async (knex) => {
    await knex.schema.dropTable('legislation');
}

export { up, down }
