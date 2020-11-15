import axios from 'axios';
import fs from 'fs';
import dayjs from 'dayjs'

import Papa from 'papaparse';
import { query, upsert } from '../db/db.js';

const colMap = {
    'CaseID': 'case_id',
    'Opened': 'opened',
    'Closed': 'closed',
    'Updated': 'updated',
    'Status': 'status',
    'Status Notes': 'status_notes',
    'Responsible Agency': 'responsible_agency',
    'Category': 'category',
    'Request Type': 'request_type',
    'Request Details': 'request_details',
    'Address': 'address',
    'Street': 'street',
    'Supervisor District': 'supervisor_district',
    'Neighborhood': 'neighborhood',
    'Police District': 'police_district',
    'Latitude': 'latitude',
    'Longitude': 'longitude',
    'Source': 'source',
    'Media URL': 'media_url'
}

const uploadRows = async (rows) => {
    rows = rows.map(r => {
        const o = {}
        for (const k in colMap) {
            o[colMap[k]] = r[k];
            if (o[colMap[k]] === '') o[colMap[k]] = null;
            
            if (['opened', 'closed', 'updated'].includes(colMap[k]) && o[colMap[k]]) {
                o[colMap[k]] = dayjs(o[colMap[k]], 'MM/DD/YYYY hh:mm:ss A').toDate()
            }

            if (['latitude', 'longitude'].includes(colMap[k]) && o[colMap[k]] === '0') o[colMap[k]] = null;
        }

        o.opened_year = o.opened.getFullYear();

        o.updated_at = new Date();
        return o
    });

    await upsert('three_one_one', rows, ['case_id']);
}

const scrapeThreeOneOne = async () => {
    const url = 'https://data.sfgov.org/api/views/vw6y-z8j6/rows.csv?accessType=DOWNLOAD';
    
    const response = await axios({
        url: url,
        responseType: 'stream'
    });
    
    const path = './scraper/downloads/311.csv'
    
    const stream = response.data.pipe(fs.createWriteStream(path));
    
    await new Promise((resolve) => {
        stream.on('finish', () => resolve());
    });
    
    let rows = [];
    let numDone = 0;

    await new Promise((resolve) => {
        Papa.parse(fs.createReadStream(path), {
            header: true,
            step: async (results, parser) => {
                numDone += 1;
                if (numDone % 100000 == 0) console.log(`Processing at index ${numDone}`);
        
                rows.push(results.data);
                if (rows.length >= 10000) {
                    parser.pause();
                    await uploadRows(rows);
                    rows = [];
                    parser.resume()
                }
            },
            complete: async () => {
                await query(`REFRESH MATERIALIZED VIEW three_one_one_annual_summary;`);
                resolve()
            }
        })
    });
}

export { scrapeThreeOneOne }