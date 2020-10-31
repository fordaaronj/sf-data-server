import { insert, query, upsert } from '../db/db.js';
import axios from 'axios';
import cheerio from 'cheerio';
import dayjs from 'dayjs'

const selectorMap = {
    type: '#ctl00_ContentPlaceHolder1_lblType2',
    introduced_on: '#ctl00_ContentPlaceHolder1_lblIntroduced2',
    on_agenda: '#ctl00_ContentPlaceHolder1_lblOnAgenda2',
    enactment_date: '#ctl00_ContentPlaceHolder1_lblEnactmentDate2',
    title: '#ctl00_ContentPlaceHolder1_lblTitle2',
    name: '#ctl00_ContentPlaceHolder1_lblName2',
    status: '#ctl00_ContentPlaceHolder1_lblStatus2',
    in_control: '#ctl00_ContentPlaceHolder1_hypInControlOf2',
    finalized_on: '#ctl00_ContentPlaceHolder1_lblPassed2',
}

let peopleMap;

const parseDates = ['introduced_on', 'on_agenda', 'enactment_date', 'finalized_on']

const getDetail = async (legislation) => {
    const $ = cheerio.load((await axios.get(legislation.details_url)).data);
    legislation = Object.keys(selectorMap).reduce((p, c) => {
        const el = $(selectorMap[c]);
        p[c] = el && el.text() && el.text().trim() ? el.text().trim() : null;
        if (parseDates.includes(c) && p[c]) p[c] = dayjs(p[c], 'M/D/YYYY').toDate();
        return p;
    }, legislation);

    legislation.history = [];
    legislation.sponsors = [];

    if ($('tr.rgNoRecords').length == 0) $('table.rgMasterTable tr').each((i, el) => {
        if (i == 0) return true;
        const step = {}
        $(el).find('td').each((i, cell) => {
            const txt = $(cell).text() && $(cell).text().trim() ? $(cell).text().trim() : null;
            if (i == 0) step.date = txt ? dayjs(txt, 'M/D/YYYY').toDate() : null;
            else if (i == 1) step.version = txt;
            else if (i == 2) step.action_by = txt;
            else if (i == 3) step.action = txt;
            else if (i == 4) step.result = txt;
            else if (i == 5) step.action_url = $(cell).find('a').attr('onclick') || null;
        });

        if (step.action_url) step.action_url = 'https://sfgov.legistar.com/' + step.action_url.split("'")[1];

        legislation.history.push(step);
    });

    $('#ctl00_ContentPlaceHolder1_tblSponsors a').each((i, el) => {
        legislation.sponsors.push($(el).text());
    });

    legislation.updated_at = new Date();

    return legislation
}

const upsertLegisation = async (results) => {
    let history = [];
    let sponsors = []

    results = results.map(r => {
        r.history = r.history.map(h => {
            h.legislation_file_num = r.file_num;
            h.updated_at = new Date();
            return h
        });

        history = history.concat(r.history);

        r.sponsors = r.sponsors.map(s => {
            return {
                legislation_file_num: r.file_num,
                person_id: peopleMap[s],
                updated_at: new Date()
            }
        }).filter(s => s.person_id);

        sponsors = sponsors.concat(r.sponsors)

        delete r.history;
        delete r.sponsors;
        return r;
    });

    await upsert('legislation', results, ['id']);

    const fileNums = results.map(r => r.file_num);

    await query(`
        WITH cte AS (
            SELECT id
            FROM legislation_history
            WHERE legislation_file_num = ANY(?)
        ), votes_delete AS (
            DELETE FROM votes 
            WHERE legislation_history_id IN (SELECT id FROM cte)
        )
        
        DELETE FROM legislation_history
        WHERE id IN (SELECT id FROM cte)
    `, [fileNums]);

    await query(`
        DELETE FROM legislation_sponsors
        WHERE legislation_file_num = ANY(?)
    `, [fileNums]);

    for (const h of history) {
        try {
            await insert('legislation_history', h);
        } catch (e) {
            console.error('failed to insert history');
            console.log(h)
        }
    }

    await insert('legislation_sponsors', sponsors);
}


const scrapeLegislationHistory = async () => {
    peopleMap = (await query(`SELECT id, name FROM people`)).reduce((p, c) => {
        p[c.name] = c.id;
        return p
    }, {});

    const legislation = await query(`
        SELECT l.id, l.file_num, l.details_url
        FROM legislation l
        LEFT JOIN legislation_history lh ON (
            lh.legislation_file_num = l.file_num
            AND lh.updated_at > l.updated_at
        )
        WHERE lh.id IS NULL
    `);

    const chunk = 20;
    for (let i = 0; i < legislation.length; i += chunk) {
        console.log(`Updating legisation ${i} of ${legislation.length}`);
        const results = await Promise.all(legislation.slice(i, i + chunk).map(l => getDetail(l)));
        await upsertLegisation(results);
    }
}

export { scrapeLegislationHistory }