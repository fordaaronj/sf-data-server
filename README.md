# Golden City Data

Scraper for [goldencitydata.com](https://www.goldencitydata.com).

### Run

- Add a `.env` file in the root directory and add a `DATABASE_URL` pointing to your Postgres database
- Run `knex migrate:latest --esm` to update your Postgres schema
- `npm run scrape`

### Built With

- [Puppeteer](https://pptr.dev/)
- Etc.