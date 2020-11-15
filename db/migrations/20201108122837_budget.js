const up = async (knex) => {
    await knex.schema.createTable('budget', t => {
        t.increments();

        t.integer('fiscal_year').notNull().index();
        t.text('revenue_or_spending').notNull().index();
        t.text('related_govt_unit').notNull().index();
        t.integer('organization_group_code').notNull().index();
        t.text('organization_group').notNull().index();
        t.text('department_code').notNull().index();
        t.text('department').notNull().index();
        t.text('program_code').notNull().index();
        t.text('program').notNull().index();
        t.text('character_code').notNull().index();
        t.text('character').notNull().index();
        t.text('object_code').notNull().index();
        t.text('object').notNull().index();
        t.text('sub_object_code').notNull().index();
        t.text('sub_object').notNull().index();
        t.text('fund_type_code').notNull().index();
        t.text('fund_type').notNull().index();
        t.text('fund_code').notNull().index();
        t.text('fund').notNull().index();
        t.integer('fund_category_code').index();
        t.text('fund_category').index();
        t.bigInteger('budget').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull();
    })
}

const down = async (knex) => {
    await knex.schema.dropTable('budget');
}

export { up, down }
