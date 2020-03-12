const cheerio = require('cheerio');
const moment = require('moment');

const CrawlerUtils = require('../../utils/crawlerutils');
/**
 * Crawler for ARSO data
 */
class ArsoWaterSloveniaCrawler {
    /**
     * @param {String} id ID of the crawler as defined in the config.
     */
    constructor(id) {
        // loading config
        this.config = CrawlerUtils.loadConfig(__dirname);
        // loading state
        this.state = CrawlerUtils.loadState(__dirname);

        if (id === this.config[0].id) {
            this.config = CrawlerUtils.loadConfig(__dirname)[0];
        } else if (id === this.config[1].id) {
            this.config = CrawlerUtils.loadConfig(__dirname)[1];
        } else {
            // throw error, how?
        }
    }

    /**
     * Run to crawl.
     */
    async crawl() {
        const self = this;
        const links = await this.getURLs();

        for (let i = 0; i < links.length - 1; i++) {
            const url = links[i];
            self.getData(url);
        }
    }

    /**
     * Construct file with URLs with data.
     *
     * @param {String} url
     * @param {String} baseUrl
     * @return {Array}
     */
    async getURLs(url = this.config.start, baseUrl = this.config.base) {
        const links = [];
        const body = await CrawlerUtils.getURL(url);

        const $ = cheerio.load(body);
        $('map > area').each((_i, element) => {
            let link = $(element).attr('href');
            link = baseUrl + link;
            links.push(link);
        });
        return links;
    }

    /**
     * Get data and save it in LDJSON file.
     *
     * @param {String} url
     */
    async getData(url) {
        let data = [];
        let stationName = '';
        let fromTime = 0;

        const body = await CrawlerUtils.getURL(url);

        const $ = cheerio.load(body);

        $('body > table > tbody > tr > td.vsebina > h1').each((_i, element) => {
            // find name of station
            // replace ' ' with '_', ' - ' with '-' and '/' with '-'
            stationName = $(element).text().replace(/ /g, '_').replace(/_-_/g, '-').replace(/\//g, '-');
        });

        fromTime = new Date(new Date().setDate(new Date().getDate() - this.config['start-first-date'])).getTime();
        if (this.state != {}) {
            if (this.state[stationName] !== undefined) {
                fromTime = this.state[stationName].lastRecord;
            }
        }

        data = this.findData($, fromTime);
        data = data.reverse();

        if ((data[0]) != undefined) {
            this.state[stationName] = {
                'lastRecord': this.checkLastDate(data),
            };

            // write final state
            CrawlerUtils.saveState(__dirname, this.state);

            const line = JSON.stringify(data);
            CrawlerUtils.saveToDataLake(line, fromTime, {
                dir: this.config.id,
                type: this.config.log_type,
                name: stationName,
            });
        }
    }

    /**
     * Find data in HTML
     * @param {*} $
     * @param {Date} fromTime
     * @return {Array}
     */
    findData($, fromTime) {
        const data = [];
        let getOut = false;

        const dataNames = this.findDataNames($);

        $('body > table > tbody > tr > td.vsebina > table.podatki > tbody > tr').each((_i, element) => {
            const newData = {};
            let iterNum = 0;

            $(element).find('td').each((i, element) => {
                let item = $(element).text();

                if (iterNum == 0) {
                    item = String(moment(item, this.config.timeParse).format());

                    if (fromTime >= Date.parse(item)) {
                        getOut = true;
                        return false;
                    };
                };
                newData[dataNames[i]] = item;
                iterNum += 1;
            });

            if (getOut) {
                return false;
            }

            const newDataCheck = Object.values(newData);
            if (this.config.id == 'arso-groundwater', newDataCheck[1] == '-' && newDataCheck[2] == '-') {
                // do not write when no data for ground water
            } else if (this.config.id == 'arso-surfacewater', newDataCheck[1] == '-' &&
             newDataCheck[2] == '-' && newDataCheck[3] == '-') {
                // do not write when no data for surface water
            } else {
                data.push(newData);
            };
        });
        return data;
    }

    /**
     * Find names of features.
     * @param {*} $
     * @return {Array}
     */
    findDataNames($) {
        const dataNames = [];
        $('body > table > tbody > tr > td.vsebina > table.podatki > thead > tr > th').each((_i, element) => {
            dataNames.push($(element).text());
        });
        return dataNames;
    }

    /**
     * Check last date.
     * @param {String} dat
     * @return {Date}
     */
    checkLastDate(dat) {
        let fromTime = Date.parse((dat[0]).Datum);
        if (fromTime != fromTime) {
            fromTime = Date.parse((dat[0]).datum);
        }
        return fromTime;
    }
}
module.exports = ArsoWaterSloveniaCrawler;
