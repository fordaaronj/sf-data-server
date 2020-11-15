import { upsert } from '../db/db.js';

// http://caaspp.edsource.org/sbac/san-francisco-unified-38684780000000
const years = [2015, 2016, 2017, 2018, 2019]
const data = {
    English: {
        'Asian': [66, 68, 70, 71, 72],
        'White': [77, 76, 77, 78, 78],
        'African American': [19, 18, 19, 20, 21],
        'Hispanic': [27, 28, 28, 29, 31]
    },
    Math: {
        'Asian': [69, 71, 72, 72, 72],
        'White': [68, 69, 70, 70, 69],
        'African American': [12, 12, 13, 12, 14],
        'Hispanic': [19, 21, 22, 22, 22]
    }
}

const scrapeTestResults = async () => {
    const rows = [];
    Object.keys(data).forEach(subject => {
        Object.keys(data[subject]).forEach(race => {
            data[subject][race].forEach((v, i) => {
                rows.push({
                    year: years[i],
                    race,
                    subject,
                    percent_met_or_exceeded: v,
                    updated_at: new Date()
                })
            })
        })
    });

    await upsert('test_results', rows, ['year', 'race', 'subject']);
}

export { scrapeTestResults }