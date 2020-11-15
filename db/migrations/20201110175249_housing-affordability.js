const up = async (knex) => {
    await knex.schema.createTable('housing_affordability', t => {
        t.increments();

        t.date('date').notNull();
        t.text('region').notNull();
        t.integer('percent_households_afford_median_home').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull();

        t.unique(['date', 'region']);
    });
}

const down = async (knex) => {
    await knex.schema.dropTable('housing_affordability');
}

export { up, down }
