const up = async (knex) => {
    await knex.schema.alterTable('legislation', t => {
        t.date('on_agenda');
        t.date('enactment_date');
        t.text('name');
        t.text('in_control');
    });

    await knex.schema.createTable('legislation_history', t => {
        t.increments();
        t.date('date').notNull().index();
        t.text('legislation_file_num').references('legislation.file_num');
        t.integer('version');
        t.text('action_by');
        t.text('action');
        t.text('result');
        t.text('action_url');

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull()
    });

    await knex.schema.createTable('legislation_sponsors', t => {
        t.increments();
        t.text('legislation_file_num').references('legislation.file_num').notNull();
        t.integer('person_id').references('people.id').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull();
        t.timestamp('updated_at').notNull();
    })
}

const down = async (knex) => {
    await knex.schema.dropTable('legislation_sponsors');
    await knex.schema.dropTable('legislation_history');
    await knex.schema.alterTable('legislation', t => {
        t.dropColumns(['on_agenda', 'enactment_date', 'name', 'in_control']);
    })
}

export { up, down }
