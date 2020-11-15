const up = async (knex) => {
    await knex.schema.createTable('test_results', t => {
        t.increments();

        t.integer('year').notNull();
        t.text('race').notNull();
        t.text('subject').notNull();
        t.integer('percent_met_or_exceeded').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull();

        t.unique(['year', 'race', 'subject']);
    });
}

const down = async (knex) => {
    await knex.schema.dropTable('test_results');
}

export { up, down }
