const up = async (knex) => {
    await knex.raw(`
        CREATE MATERIALIZED VIEW incident_category_by_year AS 
        SELECT 
            incident_category, 
            incident_year,
            count(*) "incidents",
            (count(*) FILTER (WHERE resolution IN (
                'Cite or Arrest Adult', 'ARREST, BOOKED', 'ARREST, CITED'
            )))::float / count(*) * 100 "percent_cited_or_arrested"
        
        FROM incidents
        GROUP BY 1, 2
        ORDER BY 1, 2;
    `)
} 

const down = async (knex) => {
    await knex.raw(`DROP MATERIALIZED VIEW incident_category_by_year`);
}

export { up, down }
