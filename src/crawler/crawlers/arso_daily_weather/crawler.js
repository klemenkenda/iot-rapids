// imports
const CrawlerUtils = require('../../utils/crawlerutils');
const SQLUtils = require('../../utils/sqlutils');

// external imports
const cheerio = require('cheerio'); // handling DOM
const moment = require('moment'); // handling time


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
        const weatherData = await this.getData();


        // update datalake repository with the crawled data
        // update the state with the last crawled timestamp
        await this.dataLake(weatherData);


        // pushing to db

        // existing metadata
        const nodes = await this.SQLUtils.getNodes();
        let sensors = await this.SQLUtils.getSensors();
        // console.log(sensors)

        // inserting nodes and sensors
        for (const station of weatherData) {
            const node = nodes.filter((x) => x.uuid === station.Postaja);
            let el = 0;
            if (node.length === 0) {
                await this.SQLUtils.insertNode(station.Postaja, station.Postaja, `${station.Postaja} - samodejna postaja`);
            };

            const sensor = sensors.filter((x) => x.node_uuid === station.Postaja);

            if (sensor.length === 0) {
                let i = 0;
                for (const stationSensors of Object.entries(station)) {
                    const sen = sensors.filter((x) => x.uuid === stationSensors[0]);

                    if (sen.length === 0) {
                        if (!stationSensors[0].includes('Datum') && !stationSensors[0].includes('Postaja')) {
                            await this.SQLUtils.insertSensor(`${station.Postaja} - ${i}`, station.Postaja, stationSensors[0], `${station.Postaja} - ${stationSensors[0]}`);
                            i++;
                        }
                    }
                }
            }

            let val;
            let date;
            let sensorUUID;

            // updating sensors array with new inserts
            sensors = await this.SQLUtils.getSensors();

            // inserting measurements
            for (const stationSensors of Object.entries(station)) {
                if (stationSensors[0].includes('Datum')) {
                    date = stationSensors[1];
                } else if (!stationSensors[0].includes('Datum') && !stationSensors[0].includes('Postaja')) {
                    sensorUUID = `${station.Postaja} - ${el}`;
                    val = stationSensors[1];
                    el++;

                    for (const sensorMeta of sensors) {
                        if ((sensorUUID === sensorMeta.uuid) && (val !== String.fromCharCode(160))) {
                            if (isNaN(val)) val = this.stringDataConversion(val);

                            try {
                                const SQL = this.SQLUtils.insertMeasurementSQL(sensorMeta.id, moment(date).unix(), val);
                                // console.log(SQL)

                                if (moment(date).unix() !== this.lastUnix) {
                                    this.SQLUtils.processSQL(SQL);
                                }
                            } catch (e) {console.log(SQL)}
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
        const weatherData = [];

        const body = await CrawlerUtils.getURL(url);
        const rawMeasurements = [];
        const rawHeads = [];
        const rawStyleHtml = [];
        const $ = cheerio.load(body);

        $('.meteoSI-table tbody tr td').each((i, el) => {
            const text = $(el).text();
            rawMeasurements.push(text);
            rawStyleHtml.push($(el).html());
        });
        $('.meteoSI-table thead tr th').each((i, el) => {
            const text = $(el).text();
            rawHeads.push(text);
        });

        const measurements = [];
        while (rawMeasurements.length) measurements.push(rawMeasurements.splice(0, 11));

        const heads = [];
        while (rawHeads.length) heads.push(rawHeads.splice(0, 11));

        const styleHtml = [];
        while (rawStyleHtml.length) styleHtml.push(rawStyleHtml.splice(0, 11));

        let i = 0;
        for (const station of measurements) {
            const stationData = {};
            for (const varIdx in station) {
                if (varIdx > 0) {
                    let sensorName;
                    if (heads[0][varIdx].includes('[')) {
                        sensorName = heads[0][varIdx].split('[')[0].trim();
                        stationData[sensorName] = station[varIdx];
                    } else stationData[heads[0][varIdx]] = station[varIdx];
                } else {
                    stationData['Postaja'] = station[varIdx];
                    stationData['Datum'] = heads[0][varIdx];
                }

                if (styleHtml[i][varIdx].includes('/uploads/meteo/style/img')) {
                    // if image

                    stationData[heads[0][varIdx]] = styleHtml[i][varIdx].slice(43, -6);
                }
            }
            i++;


            weatherData.push(stationData);
            // console.log(stationData)
        }

        return weatherData;
    };

    stringDataConversion(measurement) {
        if (measurement == measurement.toUpperCase()) {
            // if measurement is WIND DIRECTION - TRUE DIRECTION
            const windConversionTable = {
                S: 180,
                SE: 135,
                SW: 225,
                N: 0,
                NE: 45,
                NW: 315,
                E: 90,
                W: 270};
            return (windConversionTable[measurement]);
        } else {
            // if measurement is WEATHER DESCRIPION
            const descriptionConversionTable = {
                clear: 0,
                mostClear: 1,
                partCloudy: 2,
                modCloudy: 3,
                modCloudy_lightRA: 4,
                prevCloudy: 5,
                overcast: 6,
                overcast_lightRA: 7,
                modRA: 8,
                lightDZ: 9,
                modDZ: 10,
                modCloudy_lightDZ: 11
            };
            
            if (descriptionConversionTable[measurement] == undefined) console.log("ARSO_DAILY_CRAWLER: DescriptionConversionTable missing value for weather description. Please update the table.") 
            return (descriptionConversionTable[measurement]);
        }
    }


    async dataLake(data) {
        for (const station of data) {
            const time = station.Datum.split(', ')[1].slice(0, -5);
            station.Datum = moment(time, 'DD-MM-YYYY HH:mm').toISOString(true);
            const unix = moment(station.Datum).unix();
            


            if (this.state != {}) {
                if (this.state[station.Postaja] !== undefined) {
                    this.lastUnix = this.state[station.Postaja].lastRecord;
                    this.state[station.Postaja]['lastRecord'] = unix;
                } else {
                    this.state[station.Postaja] = {'lastRecord': unix};
                }
            }

            if (this.lastUnix !== unix) {
                CrawlerUtils.saveToDataLake(JSON.stringify(station), moment.unix(unix), {
                    dir: this.config.id,
                    type: this.config.log_type,
                    name: station.Postaja,
                });
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
