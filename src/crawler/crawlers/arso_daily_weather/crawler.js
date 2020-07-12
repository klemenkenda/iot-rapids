// imports
const CrawlerUtils = require('../../utils/crawlerutils');

// external imports
const cheerio = require('cheerio'); // handling DOM
const moment = require('moment'); // handling time
const ArsoWaterSloveniaCrawler = require('../arso_water_slovenija/crawler');

/**
 * Class for template crawler.
 */
class TemplateCrawler {
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
     * Responsible for crawling at one step.
     *
     * NOTE: Take care that the crawler is resistant to delays (it crawls
     * also historic data if needed). Crawler should provide all the steps
     * denoted in the comments of this method.
     */
    async crawl() {
        console.log('Starting crawl: ' + this.config.id);
        // do the crawling here
        let weatherData = await this.getData()
        


        // update datalake repository with the crawled data
        // update the state with the last crawled timestamp
        await this.dataLake(weatherData);




        // write final state
        CrawlerUtils.saveState(__dirname, this.state);

        console.log('Finishing crawl: ' + this.config.id);
    }

    async getData(url = this.config.start) {

        let weatherData = []

        const body = await CrawlerUtils.getURL(url);
        let rmeasurements = [];
        let rheads = [];
        let rstyleHtml = [];
        const $ = cheerio.load(body);
        
        let data = $(".meteoSI-table tbody tr td").each((i, el) => {
            let text = $(el).text()
            rmeasurements.push(text);
            rstyleHtml.push($(el).html());

        });
        let head = $(".meteoSI-table thead tr th").each((i, el) => {
            let text = $(el).text()
            rheads.push(text);     
        });

        let measurements = [];
        while(rmeasurements.length) measurements.push(rmeasurements.splice(0,11));

        let heads = [];
        while(rheads.length) heads.push(rheads.splice(0,11));

        let styleHtml = [];
        while(rstyleHtml.length) styleHtml.push(rstyleHtml.splice(0,11));

        let i = 0;
        for (let station of measurements) {
            
            let stationData = {};
            for (let varIdx in station) {
                
                if (varIdx > 0) {
                    stationData[heads[0][varIdx]] = station[varIdx];
                } else {
                    stationData["Postaja"] = station[varIdx];
                    stationData["Datum"] = heads[0][varIdx];
                
                }
                
                if (styleHtml[i][varIdx].includes("/uploads/meteo/style/img")) {

                       
                    stationData[heads[0][varIdx]] = styleHtml[i][varIdx].slice(43, -6)
                }
            }
            i++;


            weatherData.push(stationData);
        }
    
        return weatherData;
        
        
    };

    async dataLake(data) {
        for (let station of data) {
            let time = station.Datum.split(", ")[1].slice(0,-5)
            station.Datum = moment(time, "DD-MM-YYYY HH:mm").toISOString(true);
            let unix = moment(station.Datum).unix();
            let lastUnix;
            

            if (this.state != {}) {
                if (this.state[station.Postaja] !== undefined) {
                    lastUnix = this.state[station.Postaja].lastRecord;
                } else {
                    this.state[station.Postaja] = {"lastRecord" : unix};
                }
            }
            if (lastUnix !== unix) {
                CrawlerUtils.saveToDataLake(JSON.stringify(station), time, {
                    dir: this.config.id,
                    type: this.config.log_type,
                    name: station.Postaja,
                })
            }
            
        }
    }
    


    /**
     * Loads the datalake data into the database.
     */
    load() {
        // load the data from datalake into the db
    }
}

module.exports = TemplateCrawler;
