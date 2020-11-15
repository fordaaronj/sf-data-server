import axios from 'axios';
import fs from 'fs';

import Papa from 'papaparse';
import { insert, query } from '../db/db.js';

const yearLookup = {
    '3': '2010-07-01',
    '4': '2011-07-01',
    '5': '2012-07-01',
    '6': '2013-07-01',
    '7': '2014-07-01',
    '8': '2015-07-01',
    '9': '2016-07-01',
    '10': '2017-07-01',
    '11': '2018-07-01',
    '12': '2019-07-01'
}

const ageLookup = {
    '0': 'Total',
    '1': '0 to 4',
    '2': '5 to 9',
    '3': '10 to 14',
    '4': '15 to 19',
    '5': '20 to 24',
    '6': '25 to 29',
    '7': '30 to 34',
    '8': '35 to 39',
    '9': '40 to 44',
    '10': '45 to 49',
    '11': '50 to 54',
    '12': '55 to 59',
    '13': '60 to 64',
    '14': '65 to 69',
    '15': '70 to 74',
    '16': '75 to 79',
    '17': '80 to 84',
    '18': '85'
};

const scrapePopulation = async () => {
    const url = 'https://www2.census.gov/programs-surveys/popest/datasets/2010-2019/counties/asrh/cc-est2019-alldata-06.csv';
    
    const response = await axios({
        url: url,
        responseType: 'stream'
    });
    
    const path = './scraper/downloads/population.csv'
    
    const stream = response.data.pipe(fs.createWriteStream(path));
    
    await new Promise((resolve) => {
        stream.on('finish', () => resolve());
    });
    
    const ignoreCols = ['SUMLEV','STATE','COUNTY','STNAME','CTYNAME', 'AGEGRP', 'YEAR'];
    
    const rows = []
    
    const csvRows = (await new Promise((resolve) => {
        Papa.parse(fs.createReadStream(path), {
            header: true,
            complete: (results) => resolve(results.data)
        });
    })).filter(r => r.CTYNAME == 'San Francisco County');
    
    for (const r of csvRows) {
        for (const col in r) {
            if (ignoreCols.includes(col) || !yearLookup[r.YEAR]) continue;
            rows.push({
                date: yearLookup[r.YEAR],
                age_group: ageLookup[r.AGEGRP],
                metric: col,
                population: r[col],
                updated_at: new Date()
            })
        }
    }
    
    await query(`TRUNCATE population`);
    
    const chunk = 1000;
    for (let i = 0; i < rows.length; i += chunk) {
        console.log(i)
        await insert('population', rows.slice(i, i + chunk));
    }
}

export { scrapePopulation }