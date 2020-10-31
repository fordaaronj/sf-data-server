import { click, getPage, sleep } from './helpers.js';
import { query, upsert } from '../db/db.js';

import fs from 'fs';
import cheerio from 'cheerio';
import dayjs from 'dayjs';

const directory = './scraper/downloads';

const getVotes = async (page, profileUrl) => {
    if (fs.existsSync(directory)) fs.rmdirSync(directory, {recursive: true});
    fs.mkdirSync(directory);
    
    await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: directory});
    await page.goto(profileUrl);
    
    // Go to votes tab
    await click(page, '#ctl00_ContentPlaceHolder1_tabBottom > div > ul > li.rtsLI.rtsLast', true, undefined, false);
    
    // Make sure there are 3 buttons at the top of the table (# of records, group, and export). No votes = no export = 2 buttons
    const tableButtons = await page.$$('#ctl00_ContentPlaceHolder1_menuVoting > ul > li');
    if (tableButtons.length != 3) return [];

    // Click export
    await click(page, '#ctl00_ContentPlaceHolder1_menuVoting > ul > li.rmItem.rmLast');
    
    // Click Excel
    await click(page, '#ctl00_ContentPlaceHolder1_menuVoting > ul > li.rmItem.rmLast > div > ul > li.rmItem.rmFirst > a');

    console.log('Waiting for file to download')
    while (!fs.readdirSync(directory).find(f => f.endsWith('xls'))) {
        await sleep(1000);
    }

    const filename = directory + '/Export.xls';
    const $ = cheerio.load(fs.readFileSync(filename).toString());
    const votes = []
    $('tbody tr').each((i, row) => {
        const vote = {}
        $(row).find('td').each((i, cell) => {
            const txt = $(cell).text().trim();
            if (i == 0) vote.file_num = txt;
            else if (i == 1) vote.date = dayjs(txt, 'M/D/YYYY').format('YYYY-MM-DD');
            else if (i == 3) vote.vote = txt;
        });
        votes.push(vote);
    });

    fs.unlinkSync(filename);
    
    return votes;
}

const scrapeVotes = async () => {
    const legislationMap = (await query(`
        SELECT id, to_char(date, 'YYYY-MM-DD') "date", legislation_file_num
        FROM legislation_history
    `)).reduce((p, c) => {
        if (!p[c.legislation_file_num]) p[c.legislation_file_num] = {}
        if (!p[c.legislation_file_num][c.date]) p[c.legislation_file_num][c.date] = []
        p[c.legislation_file_num][c.date].push(c.id);
        return p;
    }, {});

    const people = await query(`SELECT id, name, profile_url FROM people`);
    for (const person of people) {
        const page = await getPage();
        const personalLegislationMap = JSON.parse(JSON.stringify(legislationMap));

        console.log(`Getting votes for ${person.name}`);
        let votes = await getVotes(page, person.profile_url);

        console.log(`Got ${votes.length} votes`);

        votes = votes.map(v => {
            v.person_id = person.id;
            if (personalLegislationMap[v.file_num] && personalLegislationMap[v.file_num][v.date]) {
                v.legislation_history_id = personalLegislationMap[v.file_num][v.date].pop()
            }
            delete v.file_num;
            delete v.date;
            v.updated_at = new Date();
            return v;
        }).filter(v => v.legislation_history_id);

        console.log(`Received ${votes.length} votes after filtering, upserting`);

        if (votes.length > 0) await upsert('votes', votes, ['person_id', 'legislation_history_id']);

        await page.browser().close();
    }
}

export { scrapeVotes }