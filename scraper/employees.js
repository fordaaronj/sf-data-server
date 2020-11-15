import axios from 'axios';
import fs from 'fs';

import Papa from 'papaparse';
import { insert, query } from '../db/db.js';

const scrapeEmployees = async () => {
    const url = 'https://data.sfgov.org/api/views/88g8-5mnd/rows.csv?accessType=DOWNLOAD';
    
    const response = await axios({
        url: url,
        responseType: 'stream'
    });
    
    const path = './scraper/downloads/employees.csv'
    
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
            o[colMap[k]] = r[k];
            if (o[colMap[k]] === '') o[colMap[k]] = null;
        }
        o.updated_at = new Date();
        return o
    });
    await query(`TRUNCATE employees`);
    
    const chunk = 1000;
    for (let i = 0; i < rows.length; i += chunk) {
        console.log(i)
        await insert('employees', rows.slice(i, i + chunk));
    }
}

export { scrapeEmployees }