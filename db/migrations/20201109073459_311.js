const up = async (knex) => {
    await knex.schema.createTable('three_one_one', t => {
        t.bigInteger('case_id').primary();

        t.timestamp('opened').notNull().index();
        t.integer('opened_year').notNull().index();
        t.timestamp('closed').index()
        t.timestamp('updated').notNull();
        t.text('status').notNull().index();
        t.text('status_notes');
        t.text('responsible_agency').index();
        t.text('category').index();
        t.text('request_type').index();
        t.text('request_details');
        t.text('address');
        t.text('street');
        t.integer('supervisor_district').index();
        t.text('neighborhood').index();
        t.text('police_district');
        t.float('latitude');
        t.float('longitude');
        t.text('source');
        t.text('media_url');

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull();

        t.index(['opened_year', 'category'])
    });

    await knex.raw(`
        CREATE MATERIALIZED VIEW three_one_one_annual_summary AS 
        SELECT 
            opened_year, 
            category,
            count(*) "total"
        FROM three_one_one
        GROUP BY 1, 2 
        ORDER BY 1, 2;
    `)
}

const down = async (knex) => {
    await knex.raw(`DROP MATERIALIZED VIEW three_one_one_annual_summary`);
    await knex.schema.dropTable('three_one_one');
}

export { up, down }
