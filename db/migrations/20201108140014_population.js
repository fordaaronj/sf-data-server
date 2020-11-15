const up = async (knex) => {
    await knex.schema.createTable('population', t => {
        t.increments();

        t.date('date').notNull();
        t.text('age_group').notNull();
        t.text('metric').notNull();
        t.integer('population').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull();
    })
}

const down = async (knex) => {
    await knex.schema.dropTable('population');
}

export { up, down }
