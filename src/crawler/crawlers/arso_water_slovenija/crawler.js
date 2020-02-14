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
    constructor(waterType, dataFile) {
        this.waterType = waterType;
        this.config = CrawlerUtils.loadConfig(__dirname);

        if (this.waterType == 'sw') {
            this.url = this.config.surface_water.start;
            this.baseUrl = this.config.surface_water.base;
            this.time_parse = 'DD.MM.YYYY hh:mm';
        } else if (this.waterType == 'gw') {
            this.url = this.config.ground_water.start;
            this.baseUrl = this.config.ground_water.base;
            this.time_parse = 'YYYY-MM-DD hh:mm';
        }
        this.urlFile = urlFile;
        this.dataFile = dataFile;
    }

    /**
     * Run to crawl.
     */
    async crawl() {
        const self = this;
        const links = await this.getURLs();

        const lin = await CrawlerUtils.getURL('http://www.arso.gov.si/vode/podatki/amp/Ht_30.html');
        console.log(lin);

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
    getURLs(url = this.url, baseUrl = this.baseUrl) {
        return new Promise((resolve, _) => {
            const links = [];
            request(url, (err, _res, body) => {
                if (err) {
                    console.log(err, 'error occured while hitting URL');
                } else {
                    const $ = cheerio.load(body);
                    $('map>area').each(() => {
                        let link = $(this).attr('href');
                        link = baseUrl + link;
                        links.push(link);
                    });
                    resolve(links);
                }
            });
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
        const self = this;
        request(url, (err, _res, body) => {
            if (err) {
                console.log(err, 'error occured while hitting URL');
            } else {
                const $ = cheerio.load(body);

                $('body > table > tbody > tr > td.vsebina > h1').each(() => { // find name of station
                    stationName = $(this).text().replace(/ /g, '_').replace(/_-_/g, '-').replace(/\//g, '-');
                });

                fs.readFile(self.dataFile + stationName + '.csv', 'utf-8', (err, dat) => {
                    if (err) {
                        data = self.findData($, data, fromTime);
                        self.saveToFile(data, stationName);
                    } else {
                        fromTime = self.checkLastDate(dat);
                        data = self.findData($, data, fromTime);
                        self.saveToFile(data, stationName);
                    }
                });
            }
        });
    }

    /**
     * Save data to file.
     * @param {Array} data
     * @param {String} stationName
     */
    saveToFile(data, stationName) {
        const self = this;
        for (let i = data.length; i > 0; i--) {
            fs.appendFileSync(self.dataFile + stationName + '.csv', String(data[i-1])+'\n', (err) => {});
        }
    }

    /**
     * Find data in HTML
     * @param {*} $
     * @param {Array} data
     * @param {Date} fromTime
     * @return {Array}
     */
    findData($, data, fromTime) {
        let getOut = false;
        const self = this;
        $('body > table > tbody > tr > td.vsebina > table.podatki > tbody > tr').each(() => { // get data
            const newData = [];
            let iterNum = 0;

            $(this).find('td').each(() => {
                let item = $(this).text();

                if (iterNum == 0) {
                    item = String(moment(item, self.time_parse).format());
                    if (fromTime >= Date.parse(item)) {
                        getOut = true;
                        return false;
                    };
                };
                newData.push(item);
                iterNum += 1;
            });

            if (getOut) {
                return false;
            }

            if (self.waterType == 'gw' && newData[1] == '-' && newData[2] == '-') {
                // do not write when no data for ground water
            } else if (self.waterType == 'sw' && newData[1] == '-' && newData[2] == '-' && newData[3] == '-') {
                // do not write when no data for surface water
            } else {
                data.push(newData);
            };
        });
        return data;
    }

    /**
     * Check last date.
     * @param {String} dat
     * @return {Date}
     */
    checkLastDate(dat) {
        const lines = dat.trim().split('\n');
        const lastLine = lines.slice(-1)[0];

        const splitLine = lastLine.split(',');
        const fromTime = Date.parse(splitLine.slice(0)[0]);

        return fromTime;
    }
}
module.exports = ArsoWaterSloveniaCrawler;
