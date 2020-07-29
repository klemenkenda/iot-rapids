// imports
const CrawlerUtils = require('../../utils/crawlerutils');
const SQLUtils = require('../../utils/sqlutils');

// external imports
const cheerio = require('cheerio'); // handling DOM
const moment = require('moment'); // handling time
const { createPool } = require('mariadb');


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

        this.SQLUtils = new SQLUtils();
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


        //   PUSHING TO DB

        //EXISTING PLACEHOLDERS
        let nodes = await this.SQLUtils.getNodes();
        let sensors = await this.SQLUtils.getSensors();
        //console.log(sensors)
        //NODE 
        for (let station of weatherData) {
            const node = nodes.filter(x => x.uuid === station.Postaja);
            let el = 0;
            if (node.length === 0) {
                await this.SQLUtils.insertNode(station.Postaja, station.Postaja, `${station.Postaja} - samodejna postaja`)
            };

            const sensor = sensors.filter(x => x.node_uuid === station.Postaja);
            
            if (sensor.length === 0) {
                let i = 0;
                for (let variable of Object.entries(station)) {
                    
                    const sen = sensors.filter(x => x.uuid === variable[0]);
                    
                    if (sen.length === 0) {
                        if (!variable[0].includes("Datum") && !variable[0].includes("Postaja")) {
                        
                            await this.SQLUtils.insertSensor(`${station.Postaja} - ${i}`, station.Postaja, variable[0], `${station.Postaja} - ${variable[0]}`)
                            i++;
                        }
                    }
                    
                    
                }

            }

            let val;
            let date;
            let sensorUUID;

            
            for (let variable of Object.entries(station)) {
                
                
                if (variable[0].includes("Datum")) {
                    date = variable[1];
                    
                } else if (!variable[0].includes("Datum") && !variable[0].includes("Postaja")) {
                    sensorUUID = `${station.Postaja} - ${el}`;
                    val = variable[1];
                    el++;
                    
                    for (let m of sensors) {
                        if (sensorUUID === m.uuid) {
                            
                            
                            
                            let SQL = this.SQLUtils.insertMeasurementSQL(m.id, moment(date).unix(), val)
                            this.SQLUtils.processSQL(SQL)
                            
                            
                                
                            
                        }
                    }
                
                    
                    
                    
                }
                
        
            };
        }

        




        // write final state
        CrawlerUtils.saveState(__dirname, this.state);

        console.log('Finishing crawl: ' + this.config.id);
    };

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
