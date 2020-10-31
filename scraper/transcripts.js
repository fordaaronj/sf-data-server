import axios from 'axios';
import cheerio from 'cheerio';
import { query, upsert } from '../db/db.js';
import lodash from 'lodash';

const getLines = async (transcriptUrl) => {
    const response = await axios.get(transcriptUrl);
    const $ = cheerio.load(response.data);
    const lines = $('#divTranscript').text().split(/\r?\n/g);
    return lines;
}

const upsertLines = async (meetingId, lines) => {
    let time;
    let rows = [{text: ''}];

    const speakerBreaks = lines.find(l => l.includes('>>')) ? true : false;
    console.log(`Speaker breaks: ${speakerBreaks}`);

    for (let line of lines) {
        line = line.trim();
        if (line.match(/\d\d:\d\d:\d\d/)) {
            // A few transcripts have garbage characters before the time ("g00:43:34")
            time = line.substring(line.length - 8);
            if (rows[rows.length - 1].text == '') rows[rows.length - 1].start_time = time;
            continue;
        }
        
        if (rows.length > 0) rows[rows.length - 1].text += ' '

        for (let i = 0; i < line.length; i++) {
            if (line.charAt(i) == '>' & line.charAt(i + 1) == '>') rows.push({text: '', start_time: time})

            rows[rows.length - 1].text += line.charAt(i)

            if (rows[rows.length - 1].text.match(/((Mr)|(Mrs)|(Dr)|(Miss)|(Ms))\.$/)) continue;
            if (rows[rows.length - 1].text.match(/[A-Z]\.[A-Z]\.$/)) continue;

            if (['!', '.', '?'].includes(line.charAt(i)) && (i == line.length - 1 || line.charAt(i + 1).match(/\s/))) {
                rows.push({text: '', start_time: time})
            }
        }
    }

    rows = rows.map((r, i) => {
        r.line_num = i;
        r.meeting_id = meetingId;

        r.text = r.text.trim()
        
        if ((speakerBreaks && r.text.startsWith('>>') && r.text.includes(':')) || (!speakerBreaks && r.text.match(/^[A-Z][a-zA-Z ]+:/))) {
            const lineSplit = r.text.split(':').map(s => s.trim())
            const speakerSplit = lodash.startCase(lineSplit[0]).split(' ');
            if ([1, 2].includes(speakerSplit.length)) {
                r.speaker_title = speakerSplit[0] || null;
                r.speaker_name = speakerSplit[1] || null;
                r.text = lineSplit[1];
            }
        } else if (speakerBreaks && !r.text.startsWith('>>') && i > 0) {
            r.speaker_title = rows[i - 1].speaker_title;
            r.speaker_name = rows[i-1].speaker_name;
        }

        r.text = r.text.replace('>>', '').trim();

        r.updated_at = new Date();
        return r
    }).filter(r => r.text && r.start_time)

    if (rows.length > 0) await upsert('transcripts', rows, ['meeting_id', 'line_num']);
    else console.warn(`No transcript rows were found for meeting ID ${meetingId}`)
}

const scrapeTranscripts = async () => {
    const transcripts = await query(`
        SELECT meetings.id "meeting_id", transcript_url
        FROM meetings
        LEFT JOIN transcripts ON meetings.id = transcripts.meeting_id
        WHERE 
            transcripts.id IS NULL
            AND meetings.transcript_url IS NOT NULL
    `);
    console.log(`Received ${transcripts.length} transcripts to parse`);
    for (const [index, t] of transcripts.entries()) {
        console.log(`Processing transcript for meeting ${t.meeting_id} (${t.transcript_url}), ${index + 1} / ${transcripts.length}`);
        const lines = await getLines(t.transcript_url);
        await upsertLines(t.meeting_id, lines);
    }
    console.log('Successfully parsed transcripts');
}

export { scrapeTranscripts }