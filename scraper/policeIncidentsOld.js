import axios from 'axios';
import dayjs from 'dayjs';
import fs from 'fs';

import Papa from 'papaparse';
import { query, upsert } from '../db/db.js';

let incidentLookup = {}

const uploadRows = async (rows) => {
    rows = rows.map(o => {
        const n = {
            row_id: o.PdId,
            incident_number: o.IncidntNum,
            incident_datetime: dayjs(o.Date + ' ' + o.Time, 'MM/DD/YYYY HH:mm'),
            incident_day_of_week: o.DayOfWeek,
            incident_code: o['Incident Code'],
            resolution: o.Resolution,
            police_district: o.PdDistrict,
            coordinates: `(${o.X}, ${o.Y})`,
            updated_at: new Date()
        }
        n.incident_date = n.incident_datetime.format('YYYY-MM-DD')
        n.incident_year = n.incident_datetime.year();
        n.incident_datetime = n.incident_datetime.toDate()
        n.report_datetime = n.incident_datetime

        if (!incidentLookup[n.incident_code]) incidentLookup[n.incident_code] = {}
        n.incident_category = incidentLookup[n.incident_code].incident_category;
        n.incident_subcategory = incidentLookup[n.incident_code].incident_subcategory;
        n.incident_description = incidentLookup[n.incident_code].incident_description;

        return n
    }).filter(r => r.incident_year < 2018);

    await upsert('incidents', rows, ['row_id']);
}

const scrapeIncidentsOld = async () => {
    const url = 'https://data.sfgov.org/api/views/tmnf-yvry/rows.csv?accessType=DOWNLOAD';
    
    const response = await axios({
        url: url,
        responseType: 'stream'
    });
    
    const path = './scraper/downloads/incidentsOld.csv'
    
    const stream = response.data.pipe(fs.createWriteStream(path));
    
    await new Promise((resolve) => {
        stream.on('finish', () => resolve());
    });

    incidentLookup = (await query(`
        SELECT DISTINCT incident_code, incident_category, incident_subcategory, incident_description
        FROM incidents
        WHERE incident_year >= 2018 
    `)).reduce((p, c) => {
        p[c.incident_code] = c
        return p
    }, {});
    
    let rows = [];
    let numDone = 0;

    await new Promise((resolve) => {
        Papa.parse(fs.createReadStream(path), {
            header: true,
            step: async (results, parser) => {
                numDone += 1;
                if (numDone % 100000 == 0) console.log(`Processing at index ${numDone}`);
        
                rows.push(results.data);
                if (rows.length >= 1000) {
                    parser.pause();
                    await uploadRows(rows);
                    rows = [];
                    parser.resume()
                }
            },
            complete: async () => {
                resolve()
            }
        })
    });

    await query(`REFRESH MATERIALIZED VIEW incident_category_by_year`);
}

export { scrapeIncidentsOld }