// imports
const CrawlerUtils = require('../../crawlerutils');
const parse = require('node-html-parser').parse;

class GorivaSiCrawler {

    /**
     * Responsible for loading state
     */
    constructor() {
        // loading config
        this.config = CrawlerUtils.loadConfig(__dirname);
        // loading state
        this.state = CrawlerUtils.loadState(__dirname);
    }

    /**
     * Responsible for crawling.
     *
     * NOTE: Take care that the crawler is resistant to delays (it crawls
     * also historic data if needed). Crawler should do everything that
     * is needed, including writing to database.
     */
    async crawl() {
        // do the crawling here

        // go to last parsed page
        if (this.state.page === undefined) {
            this.state.page = 1;
        }
        let url = this.config.start + "?page=" + this.state.page;
        const html = await CrawlerUtils.getURL(url);

        const root = parse(html);
        const table = root.querySelectorAll("tbody tr");

        table.forEach((el, i) => {
            let last_id;
            let fuel_code;
            let place_name;
            let place_address;
            let address;
            let price;
            let active_from;
            let active_to;
            let view_link;
            let franchise;

            let fields = el.querySelectorAll("td");

            fields.forEach((f, j) => {
                if (f.classNames[0] === 'selection') {
                    last_id = f.querySelector('input').rawAttributes.value;
                } else if (f.classNames[0] === 'fuel.code') {
                    fuel_code = f.firstChild.rawText;
                } else if (f.classNames[0] === 'place.name') {
                    place_name = f.firstChild.rawText;
                } else if (f.classNames[0] === 'place.address') {
                    place_address = f.firstChild.rawText;
                } else if (f.classNames[0] === 'address') {
                    address = f.firstChild.rawText;
                } else if (f.classNames[0] === 'price') {
                    price = f.firstChild.rawText;
                } else if (f.classNames[0] === 'active_from') {
                    active_from = f.firstChild.rawText;
                } else if (f.classNames[0] === 'active_to') {
                    active_to = f.firstChild.rawText;
                } else if (f.classNames[0] === 'franchise') {
                    franchise = f.firstChild.rawText;
                } else if (f.classNames[0] === 'view_link') {
                    view_link = f.firstChild.rawText;
                }
            })

            let record = {
                last_id: last_id,
                fuel_code: fuel_code,
                place_name: place_name,
                place_address: place_address,
                address: address,
                price: price,
                active_from: active_from,
                active_to: active_to,
                franchise: franchise,
                view_link: view_link
            };

            console.log(record);

        })

        // find last page, parse the data from all earlier pages until
        // getting the last record from before


        // update datalake repository with the crawled data

        // update the state with the last crawled timestamp

        // update state
        this.state.lastts = new Date("2020-01-01T10:10:10Z").getTime();

        // write final state
        CrawlerUtils.saveState(__dirname, this.state);

    }

    /**
     * Loads the datalake data into the database.
     */
    load() {
        // load the data from datalake into the db
        return this.config.id;
    }

}

module.exports = GorivaSiCrawler;