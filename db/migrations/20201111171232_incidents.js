const up = async (knex) => {
    await knex.schema.createTable('incidents', t => {
        t.text('row_id').primary()
        t.text('incident_id').index();

        t.text('incident_number').index().notNull();

        t.timestamp('incident_datetime').index().notNull();
        t.date('incident_date').index().notNull();
        t.integer('incident_year').index().notNull();

        t.text('incident_day_of_week').index().notNull();
        t.datetime('report_datetime').index().notNull();

        t.text('incident_code').index().notNull();
        t.text('incident_category').index();
        t.text('incident_subcategory').index();
        t.text('incident_description');
        t.text('resolution').index().notNull();

        t.text('intersection');

        t.text('police_district').notNull().index();
        t.text('analysis_neighborhood').index();

        t.text('supervisor_district').index();
        t.specificType('coordinates', 'point');

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull();

    });
    
    await knex.raw(`CREATE INDEX coordinates_idx ON incidents USING gist(coordinates)`);
} 

const down = async (knex) => {
    await knex.schema.dropTable('incidents');
}

export { up, down }
