<<<<<<< HEAD
// imports
const moment = require('moment');

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

        if (this.state.last_record === undefined) {
            this.state.last_record = -1;
        }

        let last_page = false;
        let runs = 0;
        let records = [];
        while ((runs < this.config.max_runs) && (last_page === false)) {
            if (runs !== 0) {
                this.state.page++;
            }
            records.push(await this.getRecords());

            console.log("Crawling: run =", runs, " page =", this.state.page);

            // did we reach last page
            if (this.state.page === this.state.max_page) {
                last_page = true;
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
        let url = this.config.start + "?page=" + this.state.page;
        let records = [];
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
                    last_id = parseInt(f.querySelector('input').rawAttributes.value);
                } else if (f.classNames[0] === 'fuel.code') {
                    fuel_code = f.firstChild.rawText;
                } else if (f.classNames[0] === 'place.name') {
                    place_name = f.firstChild.rawText;
                } else if (f.classNames[0] === 'place.address') {
                    place_address = f.firstChild.rawText;
                } else if (f.classNames[0] === 'address') {
                    address = f.firstChild.rawText;
                } else if (f.classNames[0] === 'price') {
                    price = parseFloat(f.firstChild.rawText.replace(',', '.'));
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
                active_from: moment(active_from, "D.M.Y. H:m").toDate(),
                /*
                // we are leaving active_to out, because it is often
                // not defined in the "incoming stream"
                active_to: moment(active_to, "D.M.Y. H:m").toDate(),
                */
                franchise: franchise,
                view_link: view_link
            };

            records.push(record);
        });

        // parse last page
        const pagination = root.querySelectorAll(".pagination li a");

        let pages = pagination.map((el, i) => {
            const value = el.rawAttributes.href === undefined ? -1 : parseInt(el.rawAttributes.href.replace(/\D/g, ''));
            return(isNaN(value) ? -1 : value);
        });
        this.state.max_page = Math.max(...pages);

        return(records);
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
        return this.config.id;
    }

}

module.exports = GorivaSiCrawler;
=======
// imports
const CrawlerUtils = require('../../crawlerutils');

// external imports
const cheerio = require('cheerio'); // handling DOM
const moment = require('moment'); // handling time

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
        try {
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
            this.records = [].concat(...records);

            // filter records
            this.records = this.records.filter((x) => x.lastId > this.state.last_record);

            // update datalake repository with the crawled data
            if (records.length > 0) {
                const line = JSON.stringify(this.records);
                const ts = records[0][0].activeFrom.getTime();

                CrawlerUtils.saveToDataLake(line, ts, {
                    dir: this.config.id,
                    type: this.config.log_type,
                });
            }

            // update database
            // TODO

            // update state
            this.state.lastrun = new Date().getTime();
            try {
                this.state.last_record = this.records.slice(-1)[0].lastId;
            } catch (e) {
                console.log(e);
            }

            // write final state
            CrawlerUtils.saveState(__dirname, this.state);
        } catch (e) {
            console.log('Error', e);
        }
    }

    /**
     * Get data records for a particular page.
     */
    async getRecords() {
        const url = this.config.start + '?page=' + this.state.page;
        const records = [];
        const html = await CrawlerUtils.getURL(url);

        const $ = cheerio.load(html);
        const table = $('tbody tr');

        table.each((i, el) => {
            let lastId;
            let fuelCode;
            let placeName;
            let placeAddress;
            let address;
            let price;
            let activeFrom;
            let viewLink;
            let franchise;

            const fields = $(el).children('td');

            fields.each((j, f) => {
                const fClassName = $(f).attr('class');
                const rawText = $(f).text();

                if (fClassName === 'selection') {
                    lastId = parseInt($(f).find('input').attr('value'));
                } else if (fClassName === 'fuel.code') {
                    fuelCode = rawText;
                } else if (fClassName === 'place.name') {
                    placeName = rawText;
                } else if (fClassName === 'place.address') {
                    placeAddress = rawText;
                } else if (fClassName === 'address') {
                    address = rawText;
                } else if (fClassName === 'price') {
                    price = parseFloat(rawText.replace(',', '.'));
                } else if (fClassName === 'active_from') {
                    activeFrom = rawText;
                } else if (fClassName === 'active_to') {
                    // activeTo = rawText;
                } else if (fClassName === 'franchise') {
                    franchise = rawText;
                } else if (fClassName === 'viewLink') {
                    viewLink = rawText;
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
        const pagination = $('.pagination li a');

        const pages = pagination.map((i, el) => {
            const value = $(el).attr('href') === undefined ?
                -1 :
                parseInt($(el).attr('href').replace(/\D/g, ''));
            return (isNaN(value) ? -1 : value);
        }).get();

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
>>>>>>> 9b477b654450cdf3f7a648e590d5f077acddabf0
