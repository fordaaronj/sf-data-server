import { scrapeThreeOneOne } from './311.js';
import { scrapeBudget } from './budget.js';
import { scrapeEmployees } from './employees.js';
import { scrapeHousingAffordability } from './housingAffordability.js';
import { scrapeLegislation } from './legislation.js';
import { scrapeLegislationHistory } from './legislationHistory.js';
import { scrapeMeetings } from './meetings.js';
import { scrapePeople } from './people.js';
import { scrapeIncidents } from './policeIncidents.js';
import { scrapePopulation } from './population.js';
import { scrapeTestResults } from './testResults.js';
import { scrapeTranscripts } from './transcripts.js';
import { scrapeTransportation } from './transportation.js';
import { scrapeVotes } from './votes.js';

import axios from 'axios';
import axiosRetry from 'axios-retry';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(timezone)
dayjs.tz.setDefault('America/Los_Angeles');

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
    console.log('Scraping 311')
    await scrapeThreeOneOne();
    console.log('Scraping budget');
    await scrapeBudget();
    console.log('Scraping population');
    await scrapePopulation();
    console.log('Scraping housing affordability');
    await scrapeHousingAffordability();
    console.log('Scraping test results');
    await scrapeTestResults();
    console.log('Scraping employees');
    await scrapeEmployees();
    console.log('Scraping incidents');
    await scrapeIncidents();
    // await scrapeIncidentsOld();
    console.log('Scraping transportation share')
    await scrapeTransportation()

    process.exit()
})();