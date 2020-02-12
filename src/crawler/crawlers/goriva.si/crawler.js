// imports
const moment = require('moment');

const CrawlerUtils = require('../../crawlerutils');
const parse = require('node-html-parser').parse;

/**
 * Crawler for goriva.si.
 */
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

        if (this.state.last_record === undefined) {
            this.state.last_record = -1;
        }

        let lastPage = false;
        let runs = 0;
        const records = [];
        while ((runs < this.config.max_runs) && (lastPage === false)) {
            if (runs !== 0) {
                this.state.page++;
            }
            records.push(await this.getRecords());

            console.log('Crawling: run =', runs, ' page =', this.state.page);

            // did we reach last page
            if (this.state.page === this.state.max_page) {
                lastPage = true;
            }

            // number of runs
            runs++;
        }

        // find last page, parse the data from all earlier pages until
        // getting the last record from before
        this.records = records;

        // update datalake repository with the crawled data

        // update state
        this.state.lastrun = new Date().getTime();

        // write final state
        CrawlerUtils.saveState(__dirname, this.state);
    }

    /**
     * Get data records for a particular page.
     */
    async getRecords() {
        const url = this.config.start + '?page=' + this.state.page;
        const records = [];
        const html = await CrawlerUtils.getURL(url);

        const root = parse(html);
        const table = root.querySelectorAll('tbody tr');

        table.forEach((el, i) => {
            let lastId;
            let fuelCode;
            let placeName;
            let placeAddress;
            let address;
            let price;
            let activeFrom;
            let viewLink;
            let franchise;

            const fields = el.querySelectorAll('td');

            fields.forEach((f, j) => {
                if (f.classNames[0] === 'selection') {
                    lastId = parseInt(f.querySelector('input')
                        .rawAttributes.value);
                } else if (f.classNames[0] === 'fuel.code') {
                    fuelCode = f.firstChild.rawText;
                } else if (f.classNames[0] === 'place.name') {
                    placeName = f.firstChild.rawText;
                } else if (f.classNames[0] === 'place.address') {
                    placeAddress = f.firstChild.rawText;
                } else if (f.classNames[0] === 'address') {
                    address = f.firstChild.rawText;
                } else if (f.classNames[0] === 'price') {
                    price = parseFloat(f.firstChild.rawText.replace(',', '.'));
                } else if (f.classNames[0] === 'activeFrom') {
                    activeFrom = f.firstChild.rawText;
                } else if (f.classNames[0] === 'activeTo') {
                    activeTo = f.firstChild.rawText;
                } else if (f.classNames[0] === 'franchise') {
                    franchise = f.firstChild.rawText;
                } else if (f.classNames[0] === 'viewLink') {
                    viewLink = f.firstChild.rawText;
                }
            });

            const record = {
                lastId: lastId,
                fuelCode: fuelCode,
                placeName: placeName,
                placeAddress: placeAddress,
                address: address,
                price: price,
                activeFrom: moment(activeFrom, 'D.M.Y. H:m').toDate(),
                /*
                // we are leaving activeTo out, because it is often
                // not defined in the "incoming stream"
                activeTo: moment(activeTo, "D.M.Y. H:m").toDate(),
                */
                franchise: franchise,
                viewLink: viewLink,
            };

            records.push(record);
        });

        // parse last page
        const pagination = root.querySelectorAll('.pagination li a');

        const pages = pagination.map((el, i) => {
            const value = el.rawAttributes.href === undefined ?
                -1 :
                parseInt(el.rawAttributes.href.replace(/\D/g, ''));
            return (isNaN(value) ? -1 : value);
        });
        this.state.max_page = Math.max(...pages);

        return (records);
    }

    /**
     * Saving records to data-lake and to database.
     */
    save() {
        // save to data lake
        // save to data base
    }

    /**
     * Loads the datalake data into the database.
     */
    load() {
        // load the data from datalake into the db
        // return this.config.id;
    }
}

module.exports = GorivaSiCrawler;
