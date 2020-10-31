import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

const getPage = async () => {
    const browser = await puppeteer.launch({headless: process.env.PUPPETEER_HEADLESS == 1});
    const page = await browser.newPage();
    await page.setUserAgent('user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
    return page;
}

const click = async (page, selector, waitForNavigation, postClickDelayMs=1000, failOnNavigationError=true) => {
    await page.waitForSelector(selector);

    const promises = [page.click(selector)];
    if (waitForNavigation) promises.push(page.waitForNavigation({timeout: 1000 * 120}));
    try {
        await Promise.all(promises);
    } catch (e) {
        if (failOnNavigationError) throw Error(e)
    }
    if (postClickDelayMs) await sleep(postClickDelayMs);
}

const cleanText = (text) => {
    if (!text) return;

    // Replace no-break space (&nbsp)
    text = text.replace(/\u00A0/g, ' ').replace(/\s\s+/g, ' ').trim()
    if (text == 'Not available') return null;
    return text || null;
}

const scrapeTable = async (page) => {
    const headers = (await page.$$eval('th.rgHeader', els => els.map(el => el.textContent))).map((v, i) => {
        return cleanText(v ? v : `Column ${i}`)
    });
    const result = {data: []}
    
    const rows = (await page.$$('tr.rgAltRow')).concat(await page.$$('tr.rgRow'));
    for (const row of rows) {
        const rowData = (await row.$$eval('td', els => els.map(el => {
            let href;
            const onclick = el.querySelector('a') ? el.querySelector('a').getAttribute('onclick') : null;
            if (onclick && onclick.startsWith('window.open')) href = onclick.split("'")[1];
            else href = (el.querySelector('a') && el.querySelector('a').getAttribute('href') != '#') ? el.querySelector('a').href : null

            if (href && !href.startsWith('http')) href = 'https://sfgov.legistar.com/' + href;

            return {
                text: el.innerText || null,
                href: href || null
            }
        }))).reduce((previousValue, currentValue, currentIndex) => {
            currentValue.text = cleanText(currentValue.text)
            previousValue[headers[currentIndex]] = currentValue;
            return previousValue
        }, {});
        result.data.push(rowData);
    }

    const nextPageSelector = '.rgNumPart a.rgCurrentPage + a';

    if (await page.$(nextPageSelector)) {
        // Click the next page link
        await click(page, nextPageSelector);
        // Wait for the pagination to be visible again
        await page.waitForSelector('.rgNumPart', {visible: true, timeout: 1000 * 60 * 2});
        result.nextPage = true;
    } else result.nextPage = false;

    return result;
}

export { sleep, getPage, click, scrapeTable }