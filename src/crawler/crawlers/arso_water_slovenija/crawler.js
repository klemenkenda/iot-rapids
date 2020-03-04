const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');

const CrawlerUtils = require('../../crawlerutils');

/**
 *
 */
class ArsoWaterSloveniaCrawler {
    /**
     *
     * @param {String} waterType 'sv' for surface watter, gv for ground watter
     * @param {*} dataFile
     */
    constructor() {
        this.config = CrawlerUtils.loadConfig(__dirname);
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
     * Construct file with URLs with data
     * @param {String} url
     * @param {String} baseUrl
     * @return {Promise}
     */
    async getURLs(url = this.config.start, baseUrl = this.config.base) {
        return new Promise(async (resolve, _) => {
            const links = [];
            const body = await CrawlerUtils.getURL(url);

            const $ = cheerio.load(body);
            $('map > area').each((_i, element) => {
                let link = $(element).attr('href');
                link = baseUrl + link;
                links.push(link);
            });
            resolve(links);
        });
    }

    /**
     * Get data and save it in csv file
     * @param {String} url
     */
    getData(url) {
        let data = [];
        let stationName = '';
        let fromTime = 0;

        request(url, (err, _res, body) => {
            if (err) {
                console.log(err, 'error occured while hitting URL');
            } else {
                const $ = cheerio.load(body);

                $('body > table > tbody > tr > td.vsebina > h1').each((_i, element) => { // find name of station
                    stationName = $(element).text().replace(/ /g, '_').replace(/_-_/g, '-').replace(/\//g, '-');
                });
                const dirState = __dirname + '/' + this.config.state + '/' + stationName;

                const state = CrawlerUtils.loadState(dirState);

                if (state.lastRecord != undefined) {
                    fromTime = state.lastRecord;
                } else {
                    // 30 days before today
                    fromTime = new Date(new Date().setDate(new Date().getDate()-30)).getTime();
                }
                data = this.findData($, fromTime);

                if ((data[0]) != undefined) {
                    const newState = {'lastRecord': this.checkLastDate(data)};

                    // create directirys for states
                    if (!fs.existsSync(dirState + '/../')) {
                        fs.mkdirSync(dirState + '/../');
                    }
                    if (!fs.existsSync(dirState)) {
                        fs.mkdirSync(dirState);
                    }

                    CrawlerUtils.saveState(dirState, newState);

                    const line = JSON.stringify(data);
                    CrawlerUtils.saveToDataLake(line, fromTime, {
                        dir: this.config.id + '/' + stationName,
                        type: this.config.log_type,
                    });
                }
            }
        });
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

        $('body > table > tbody > tr > td.vsebina > table.podatki > tbody > tr').each((_i, element) => { // get data
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

            if (newData[1] == '-' && newData[2] == '-') {
                // do not write when no data for ground water
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
        const fromTime = Date.parse((dat[0]).Datum);
        return fromTime;
    }
}
module.exports = ArsoWaterSloveniaCrawler;
