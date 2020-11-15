import axios from 'axios';
import fs from 'fs';

import Papa from 'papaparse';
import { upsert } from '../db/db.js';

const scrapeTransportation = async () => {
    const url = 'https://transtat.sfmta.com/t/public/views/Goal2Dashboards/2_2_2Table.csv';
    
    const response = await axios({
        url: url,
        responseType: 'stream'
    });
    
    const path = './scraper/downloads/transportation.csv'
    
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
    
    rows = rows.map(r => ({
        fiscal_year: parseInt(r['Fiscal Year'].replace('FY ', '')),
        mode: r['Travel Mode Detail'],
        percent_share: Math.round(parseFloat(r['Share']) * 100) || 0,
        updated_at: new Date()
    }));

    await upsert('transportation_share', rows, ['fiscal_year', 'mode']);
}

export { scrapeTransportation }