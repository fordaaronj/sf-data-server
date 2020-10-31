import { click, getPage, scrapeTable } from './helpers.js';
import { upsert } from '../db/db.js';

const setupFilters = async (page) => {   
    await page.goto('https://sfgov.legistar.com/People.aspx');
    await click(page, '#ctl00_ContentPlaceHolder1_menuPeople > ul > li.rmItem.rmLast', false, 3000);
    await click(page, '#ctl00_ContentPlaceHolder1_menuPeople > ul > li.rmItem.rmLast > div > ul > li.rmItem.rmLast > a > span', true);
}

const upsertData = async (data) => {
    const people = data.map(d => ({
        name: d['Person Name'].text,
        profile_url: d['Person Name'].href,
        email: d['E-mail'].text,
        website: d['Web Site'].text,
        updated_at: new Date()
    }));

    await upsert('people', people, ['name']);
}

const scrapePeople = async () => {
    console.log('Loading Puppeteer')
    const page = await getPage();
    
    await setupFilters(page);

    let result = {nextPage: true}
    let pageNum = 1;
    while (result.nextPage) {
        console.log(`Scraping page ${pageNum}`);
        result = await scrapeTable(page);
        await upsertData(result.data);

        pageNum += 1;
    }

    await page.browser().close();
}

export { scrapePeople }