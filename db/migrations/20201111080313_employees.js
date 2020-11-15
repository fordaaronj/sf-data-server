const up = async (knex) => {
    await knex.schema.createTable('employees', t => {
        t.increments();

        t.text('year_type').notNull().index();
        t.integer('year').notNull().index();

        t.integer('organization_group_code').notNull().index();
        t.text('organization_group').notNull().index();

        t.text('department_code').index();
        t.text('department').index();

        t.integer('union_code').index();
        t.text('union').index();

        t.text('job_family_code').notNull().index();
        t.text('job_family').notNull().index();

        t.text('job_code').notNull().index();
        t.text('job').index();

        t.integer('employee_identifier').notNull().index();
        
        t.decimal('salaries').notNull();
        t.decimal('overtime').notNull();
        t.decimal('other_salaries').notNull();
        t.decimal('total_salary').notNull();
        t.decimal('retirement').notNull();
        t.decimal('health_and_dental').notNull()
        t.decimal('other_benefits').notNull();
        t.decimal('total_benefits').notNull();
        t.decimal('total_compensation').notNull();

        t.timestamp('created_at').defaultTo(knex.fn.now()).notNull()
        t.timestamp('updated_at').notNull();
    });
} 

const down = async (knex) => {
    await knex.schema.dropTable('employees');
}

export { up, down }
