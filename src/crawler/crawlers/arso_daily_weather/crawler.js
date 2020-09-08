// imports
const CrawlerUtils = require('../../utils/crawlerutils');
const SQLUtils = require('../../utils/sqlutils');

// external imports
const cheerio = require('cheerio'); // handling DOM
const moment = require('moment'); // handling time

/**
 * Crawler for ARSO automatic weather stations.
 */
class ArsoDailyWeatherCrawler {
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
     * Crawler functionality: arso_daily_weather crawls live weather data from meteo.arso.gov.si that updates
     * every 10 minutes.
     *
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
                for (const stationSensors of Object.keys(station)) {
                    const sen = sensors.filter((x) => x.uuid === stationSensors);
                    if (sen.length === 0) {
                        if (!stationSensors.includes('Datum') && !stationSensors.includes('Postaja')) {
                            await this.SQLUtils.insertSensor(`${station.Postaja} - ${i}`, station.Postaja, stationSensors, `${station.Postaja} - ${stationSensors}`);
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
            for (const stationSensors of Object.keys(station)) {
                if (stationSensors.includes('Datum')) {
                    date = station[stationSensors];
                } else if (!stationSensors.includes('Datum') && !stationSensors.includes('Postaja')) {
                    sensorUUID = `${station.Postaja} - ${el}`;
                    val = station[stationSensors];
                    el++;

                    for (const sensorMeta of sensors) {
                        if ((sensorUUID === sensorMeta.uuid) && (val !== String.fromCharCode(160))) {
                            if (isNaN(val)) {
                                val = this.stringDataConversion(val);
                            }
                            try {
                                const SQL = this.SQLUtils.insertMeasurementSQL(sensorMeta.id, moment(date).unix(), val);
                                // console.log(SQL)
                                if (moment(date).unix() !== this.lastUnix) {
                                    this.SQLUtils.processSQL(SQL);
                                }
                            } catch (e) {
                                console.log(SQL);
                            }
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

        // shaping 1D arrays with length n to 2D arrays with length 11 (number of different station sensors)
        const measurements = [];
        while (rawMeasurements.length) {
            measurements.push(rawMeasurements.splice(0, 11));
        }
        const heads = [];
        while (rawHeads.length) {
            heads.push(rawHeads.splice(0, 11));
        }
        const styleHtml = [];
        while (rawStyleHtml.length) {
            styleHtml.push(rawStyleHtml.splice(0, 11));
        }
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

                // if image => get the title of the image to later convert to integer
                if (styleHtml[i][varIdx].includes('/uploads/meteo/style/img')) {
                    stationData[heads[0][varIdx]] = styleHtml[i][varIdx].slice(43, -6);
                }
            }
            i++;
            weatherData.push(stationData);
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
                W: 270,
            };
            return (windConversionTable[measurement]);
        } else {
            // if measurement is WEATHER DESCRIPION
            const descriptionConversionTable = {
                clear: 0,
                mostClear: 1,
                partCloudy: 2,
                modCloudy: 3,
                modCloudy_lightRA: 4,
                modCloudy_lightDZ: 5,
                prevCloudy: 6,
                prevCloudy_lightRA: 7,
                prevCloudy_modRA: 8,
                prevCloudy_heavyRA: 9,
                overcast: 10,
                overcast_lightRA: 11,
                overcast_modRA: 12,
                overcast_heavyRA: 13,
                overcast_heavySN: 14,
                overcast_lightSHGR: 15,
                lightRA: 16,
                modRA: 17,
                heavyRA: 18,
                lightDZ: 19,
                modDZ: 20,
                heavyDZ: 21,
                FG_heavyRA: 22,
                FG_modRA: 23,
                heavySN: 24,
                overcast_modRASN: 25,
                modRASN: 26,
            };
            if (descriptionConversionTable[measurement] == undefined) {
                console.log('ARSO_DAILY_CRAWLER: DescriptionConversionTable missing value for weather description.');
                console.log('Please update the table for value: ' + measurement + '.');
            }
            return (descriptionConversionTable[measurement]);
        }
    }

    /*
    * Updates current state of each weather station
    * Prepares and saves crawled weather data to DataLake as .ldjson
    */
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

module.exports = ArsoDailyWeatherCrawler;
