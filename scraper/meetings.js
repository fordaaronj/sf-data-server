import { click, getPage, scrapeTable } from './helpers.js';
import dayjs from 'dayjs';
import { query, upsert } from '../db/db.js';


const setupFilters = async (page) => {
    // Visit the SF calendar homepage
    await page.goto('https://sfgov.legistar.com/Calendar.aspx');
    
    // By default the homepage is only set to the most recent year. Change the dropdown to "All Years".
    // Click the years selector dropdown
    await click(page, 'td#ctl00_ContentPlaceHolder1_tdYears');
    // Click the first item in the dropdown (All Years)
    await click(page, 'li.rcbItem');
    // Submit the screen
    await click(page, '#ctl00_ContentPlaceHolder1_btnSearch', true);
}

const upsertData = async (data) => {
    const map = {}
    const meetings = data.filter(row => row['Meeting Time'].text != 'Canceled').map(row => {
        const meeting = {
            committee: row.Name.text,
            location: row['Meeting Location'].text,
            details_url: row['Meeting Details'].href,
            time: dayjs(row['Meeting Date'].text + ' ' + row['Meeting Time'].text, 'M/D/YYYY h:mm A').toISOString(),
            agenda_url: row.Agenda.href,
            minutes_url: row.Minutes.href,
            video_url: row.Video.href,
            audio_url: row.Audio.href,
            transcript_url: row.Transcript.href,
            updated_at: new Date()
        }

        if (meeting.location.endsWith(' Meeting')) {
            const locationSplit = meeting.location.split(/\s/g);
            const meetingSplit = locationSplit.splice(locationSplit.length - 2);
            meeting.type = meetingSplit.join(' ');
            meeting.location = locationSplit.join(' ') || null;
        }

        if (meeting.type) {
            if (!map[meeting.committee]) map[meeting.committee] = {};
            if (!map[meeting.committee][meeting.time]) map[meeting.committee][meeting.time] = {}
            if (!map[meeting.committee][meeting.time][meeting.type]) map[meeting.committee][meeting.time][meeting.type] = true;
            else {
                console.log('Duplicate meeting detected');
                meeting.duplicate = true;
            }
        }

        return meeting;
    }).filter(m => !m.duplicate);
    
    try {
        await upsert('meetings', meetings, ['committee', 'time', 'type']);
    } catch (error) {
        console.error(error);
    }

    return meetings;
}

const scrapeMeetings = async () => {
    const page = await getPage();
    await setupFilters(page);

    let latestResult = (await query(`
        SELECT (max(time) - interval '3 months')::date::text "date"
        FROM meetings
    `))[0];
    latestResult = latestResult ? latestResult.date : null;

    let result = {nextPage: true}
    let pageNum = 1;
    while (result.nextPage) {
        console.log(`Scraping page ${pageNum}`);
        result = await scrapeTable(page);
        const upsertedMeetings = await upsertData(result.data);

        if (latestResult && upsertedMeetings[upsertedMeetings.length - 1].time < latestResult) {
            console.log('Reached all we need to update, ending')
            result.nextPage = false;
        }

        pageNum += 1;
    }

    console.log('Done');
    await page.browser().close();
}

export { scrapeMeetings }