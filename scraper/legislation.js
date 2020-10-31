import { click, getPage, scrapeTable } from './helpers.js';
import { query, upsert } from '../db/db.js';

const setupFilters = async (page) => {   
    await page.goto('https://sfgov.legistar.com/Legislation.aspx');

    // Click the years selector dropdown
    await click(page, 'td#ctl00_ContentPlaceHolder1_tdYears');
    // Click the first item in the dropdown (All Years)
    await click(page, 'li.rcbItem');
    // Submit the screen
    await click(page, 'button#visibleSearchButton', true);
    // Click the show # of records dropdown
    await click(page, '#ctl00_ContentPlaceHolder1_menuMain > ul > li:nth-child(2)');
    // Click show all records
    await click(page, '#ctl00_ContentPlaceHolder1_menuMain > ul > li:nth-child(2) > div > ul > li.rmItem.rmLast', true);
}

const upsertData = async (data) => {
    const legislation = data.map(d => ({
        file_num: d['File #'].text,
        details_url: d['File #'].href,
        updated_at: new Date()
    })).filter(l => l.file_num && l.details_url)

    await upsert('legislation', legislation, ['file_num']);

    return legislation;
}

const scrapeLegislation = async () => {
    const page = await getPage();
    
    await setupFilters(page);

    const existingFileNums = (await query(`
        SELECT file_num
        FROM legislation
    `)).map(r => r.file_num);

    let result = {nextPage: true}
    let pageNum = 1;
    while (result.nextPage) {
        console.log(`Scraping page ${pageNum}`);
        result = await scrapeTable(page);
        let updatedLegislation = await upsertData(result.data);

        updatedLegislation = updatedLegislation.filter(l => !existingFileNums.includes(l.file_num));
        if (updatedLegislation.length == 0) {
            console.log('No legislation updated from this page, stopping');
            result.nextPage = false;
        }

        pageNum += 1;
    }

    await page.browser().close();
}

export { scrapeLegislation }