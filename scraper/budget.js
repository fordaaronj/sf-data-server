import axios from 'axios';
import fs from 'fs';

import Papa from 'papaparse';
import { insert, query } from '../db/db.js';

const scrapeBudget = async () => {
    const url = 'https://data.sfgov.org/api/views/xdgd-c79v/rows.csv?accessType=DOWNLOAD&api_foundry=true';
    
    const response = await axios({
        url: url,
        responseType: 'stream'
    });
    
    const path = './scraper/downloads/budget.csv'
    
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
        o.budget = Math.round(o.budget);
        o.updated_at = new Date();
        return o
    });
    await query(`TRUNCATE budget`);
    
    const chunk = 1000;
    for (let i = 0; i < rows.length; i += chunk) {
        console.log(i)
        await insert('budget', rows.slice(i, i + chunk));
    }
}

export { scrapeBudget }