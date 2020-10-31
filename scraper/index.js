import { scrapeMeetings } from './meetings.js';
import { scrapeTranscripts } from './transcripts.js';
import { scrapePeople } from './people.js';
import { scrapeLegislation } from './legislation.js';
import { scrapeVotes } from './votes.js';
import { scrapeLegislationHistory } from './legislationHistory.js';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(timezone)
dayjs.tz.setDefault('America/Los_Angeles');

import axios from 'axios';
import axiosRetry from 'axios-retry';
axiosRetry(axios, { retries: 3 });

(async () => {
    console.log('Scraping meetings');
    await scrapeMeetings();
    console.log('Scraping transcripts');
    await scrapeTranscripts();
    console.log('Scraping people');
    await scrapePeople();
    console.log('Scraping legislation');
    await scrapeLegislation();
    console.log('Scraping legislation detail');
    await scrapeLegislationHistory();
    console.log('Scraping votes');
    await scrapeVotes();

    process.exit()
})();