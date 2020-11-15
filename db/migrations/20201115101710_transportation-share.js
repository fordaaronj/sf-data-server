const up = async (knex) => {
    await knex.schema.createTable('transportation_share', t => {
        t.increments();

        t.integer('fiscal_year').notNull();
        t.text('mode').notNull();
        t.integer('percent_share').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull();

        t.unique(['fiscal_year', 'mode']);

    });
} 

const down = async (knex) => {
    await knex.schema.dropTable('transportation_share');
}

export { up, down }
