const up = async (knex) => {
    await knex.schema.createTable('votes', t => {
        t.increments();
        t.integer('legislation_history_id').references('legislation_history.id').notNull();
        t.integer('person_id').references('people.id').notNull();
        t.text('vote').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull();

        t.unique(['legislation_history_id', 'person_id']);
    });
}

const down = async (knex) => {
    await knex.schema.dropTable('votes');
}

export { up, down }
