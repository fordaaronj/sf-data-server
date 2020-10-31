const up = async (knex) => {
    await knex.schema.createTable('aggregation', t => {
        t.text('category');
        t.bigInteger('count')
    })

    await knex.raw(`
        CREATE FUNCTION search_transcripts_agg_years(search text)
        RETURNS SETOF aggregation AS $$
            SELECT 
                extract(year from meetings.time)::text "year",
                count(*) "num"
            FROM transcripts
            JOIN meetings ON transcripts.meeting_id = meetings.id
            WHERE transcripts.text_index @@ plainto_tsquery('english', search)
            GROUP BY 1
        $$ LANGUAGE sql stable;
    `);

    await knex.raw(`
        CREATE FUNCTION search_transcripts_agg_speakers(search text)
        RETURNS SETOF aggregation AS $$
            SELECT 
                speaker_name,
                count(*) "num"
            FROM transcripts
            WHERE text_index @@ plainto_tsquery('english', search)
            GROUP BY 1
        $$ LANGUAGE sql stable;
    `)
}

const down = async (knex) => {
    await knex.raw(`DROP FUNCTION search_transcripts_agg_speakers`);
    await knex.raw(`DROP FUNCTION search_transcripts_agg_years`);
    await knex.schema.dropTable('aggregation')
}

export { up, down }
