const up = async (knex) => {
    await knex.raw(`
        CREATE FUNCTION search_transcripts(search text) 
        RETURNS SETOF transcripts AS $$ 
            
            SELECT * 
            FROM transcripts 
            WHERE text_index @@ plainto_tsquery('english', search)

        $$ language sql stable;
    `)
}

const down = async (knex) => {
    await knex.raw(`DROP FUNCTION search_transcripts`);
}

export { up, down }
