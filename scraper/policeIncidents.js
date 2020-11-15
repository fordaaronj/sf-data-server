import axios from 'axios';
import dayjs from 'dayjs';
import fs from 'fs';

import Papa from 'papaparse';
import { query, upsert } from '../db/db.js';

const scrapeIncidents = async () => {
    const url = 'https://data.sfgov.org/api/views/wg3w-h783/rows.csv?accessType=DOWNLOAD';

    const pgColumns = (await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE 
            table_schema = 'public'
            AND "table_name" = 'incidents'
    `)).map(r => r.column_name);
    
    const response = await axios({
        url: url,
        responseType: 'stream'
    });
    
    const path = './scraper/downloads/incidents.csv'
    
    const stream = response.data.pipe(fs.createWriteStream(path));
    
    await new Promise((resolve) => {
        stream.on('finish', () => resolve());
    });
    
    let rows = await new Promise((resolve) => {
        Papa.parse(fs.createReadStream(path), {
            header: true,
            complete: (results) => resolve(results.data)
        });
    });
    
    const colMap = Object.keys(rows[0]).reduce((p, c) => {
        p[c] = c.replace(/ |-/g, '_').toLowerCase();
        return p;
    }, {});
    
    rows = rows.map(r => {
        const o = {}
        for (const k in colMap) {
            if (!pgColumns.includes(colMap[k])) continue;

            o[colMap[k]] = r[k];
            if (o[colMap[k]] === '') o[colMap[k]] = null;
        }

        o.incident_datetime = o.incident_datetime ? dayjs(o.incident_datetime, 'M/D/YYYY h:mm:ss A') : null
        o.incident_date = o.incident_datetime ? o.incident_datetime.format('YYYY-MM-DD') : null
        o.incident_year = o.incident_datetime ? o.incident_datetime.year() : null
        o.incident_datetime = o.incident_datetime ? o.incident_datetime.toDate() : null

        o.report_datetime = o.report_datetime ? dayjs(o.report_datetime, 'M/D/YYYY h:mm:ss A').toDate() : null

        o.coordinates = r.Latitude && r.Longitude ? `(${r.Longitude}, ${r.Latitude})` : null

        o.updated_at = new Date();
        return o
    });
    
    const chunk = 1000;
    for (let i = 0; i < rows.length; i += chunk) {
        console.log(i)
        await upsert('incidents', rows.slice(i, i + chunk), ['row_id']);
    }

    await query(`REFRESH MATERIALIZED VIEW incident_category_by_year`);
}

export { scrapeIncidents }