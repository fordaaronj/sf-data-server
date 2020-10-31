const up = async (knex) => {
    await knex.schema.createTable('people', t => {
        t.increments('id');
        t.text('name').notNull().unique();
        t.text('profile_url').notNull();
        t.text('email');
        t.text('website');

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull()
    })
}

const down = async (knex) => {
    await knex.schema.dropTable('people');
}

export { up, down }
