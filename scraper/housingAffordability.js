import fs from 'fs';
import Papa from 'papaparse';
import dayjs from 'dayjs'
import { upsert } from '../db/db.js';

const file = './scraper/manual_downloads/housing-affordability.csv';

const scrapeHousingAffordability = async () => {   
    let rows = await new Promise((resolve) => {
        Papa.parse(fs.createReadStream(file), {
            header: true,
            complete: (results) => resolve(results.data)
        });
    });
    
    const upserts = [];

    rows.filter(r => Object.values(r)[0] && Object.values(r)[0] != '----').forEach(r => {
        let date = Object.values(r)[0];
        
        if (date.includes('-')) date = dayjs(date, 'MMM-YY').format('YYYY-MM-DD')
        else {
            const dateSplit = date.split('.')
            date = dayjs(`${parseInt(dateSplit[0])}-${parseInt(dateSplit[1]) * 3}-01`, 'YYYY-M-DD').format('YYYY-MM-DD')
        }

        Object.keys(r).forEach((k, i) => {
            if (!k || i === 0 || !r[k]) return;
            const val = parseInt(r[k].replace('%', ''));
            if (!val) return;
            upserts.push({
                date,
                region: k,
                percent_households_afford_median_home: val,
                updated_at: new Date()
            })
        })
    });

    const chunk = 1000;

    for (let i = 0; i < upserts.length; i+= chunk) {
        await upsert('housing_affordability', upserts.slice(i, i + chunk), ['date', 'region']);
    }
}

export { scrapeHousingAffordability }