// imports
const CrawlerUtils = require('../../utils/crawlerutils');
const SQLUtils = require('../../utils/sqlutils.js');

// external imports
const cheerio = require('cheerio');

// const cheerio = require('cheerio'); // handling DOM
const moment = require('moment'); // handling time

/**
 * Class for template crawler.
 */
class ArsoWeatherSloveniaCrawler {
    /**
     * Responsible for loading state
     */
    constructor() {
        // loading config
        this.config = CrawlerUtils.loadConfig(__dirname);
        // loading state
        this.state = CrawlerUtils.loadState(__dirname);
        this.timeInterval = [this.config.start_time, moment().subtract(1, 'day').format('YYYY-MM-DD')];

        this.SQLUtils = new SQLUtils();
        // this.SQLUtils.getPlaces();
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
        // retrieve data from SQL
        let places = await this.SQLUtils.getPlaces();
        const nodes = await this.SQLUtils.getNodes();
        let sensors = await this.SQLUtils.getSensors();


        // do the crawling here
        try {
            const placeData = await this.getLocationData();

            const abort = await this.checkLastCrawl();
            // checks time of last crawl - if none starts from selected start date

            const stationNames = [];
            const stationInfo = [];

            for (const el of Object.keys(placeData.points)) {
                const node_p = {
                    uuid: el.slice(1),
                    title: placeData.points[el].name,
                    x: placeData.points[el].lon,
                    y: placeData.points[el].lat,
                };

                stationNames.push(node_p.title);
                stationInfo.push(node_p);

                // does this place already exist?

                const place = places.filter((x) => x.uuid === node_p.uuid);
                if (place.length === 0) {
                    try {
                        await this.SQLUtils.insertPlace('arso_weather_slovenija', node_p.uuid, node_p.title, node_p.x, node_p.y).catch();
                    } catch (e) {
                        console.log('Table is empty');
                    };
                };

                // inserting nodes
                const node = nodes.filter((x) => x.uuid === node_p.uuid);
                if (node.length === 0) {
                    try {
                        await this.SQLUtils.insertNode(node_p.uuid, node_p.uuid, node_p.title + ' samodejna postaja');
                    } catch (e) {};
                };
            }

            while ((moment(this.timeInterval[0]).isBefore(this.timeInterval[1])) && abort !== true) {
                // Sorting specific crawl data to arrays to use later
                places = await this.SQLUtils.getPlaces();

                const weatherData = await this.getWeatherData(places);

                let param;
                let weatherParamSorted;
                const stationList = [];
                for (const station in weatherData) {
                    param = [];
                    const name = stationNames[station];
                    weatherParamSorted = [];
                    stationList.push(name);
                    for (const vars of Object.values(weatherData[station].params)) {
                        param.push(vars);
                    }
                    for (const sorted of Object.keys(weatherData[station].params)) {
                        weatherParamSorted.push(sorted);
                    }
                    let lastMeasure;
                    const stationData = [];
                    let lastUnix;
                    for (const el of Object.values(weatherData[station].points)) {
                        for (const ts of Object.keys(el)) {
                            lastUnix = (parseInt(ts.slice(1))-89411160)*60;
                            lastMeasure = moment.unix((parseInt(ts.slice(1))-89411160)*60).toISOString(true);
                            const measurement = {
                                'Date': lastMeasure,
                            };
                            for (const i in param) {
                                if (Object.entries(el[ts])[i]) {
                                    measurement[`${param[i].name} [${param[i].unit}]`] = `${Object.entries(el[ts])[i][1]}`;
                                } else {
                                    measurement[`${param[i].name} [${param[i].unit}]`] = '/';
                                }
                            }

                            stationData.push(JSON.stringify(measurement));
                        }
                    }


                    // Inserting sensors
                    sensors = await this.SQLUtils.getSensors();
                    for (const idx in stationInfo) {
                        for (const sensor of weatherParamSorted) {
                            const duplicateSensor = sensors.filter((x) => x.uuid === `${stationInfo[idx].uuid} - ${sensor.slice(1)}`);
                            if (duplicateSensor.length === 0) {
                                await this.SQLUtils.insertSensor(`${stationInfo[idx].uuid} - ${sensor.slice(1)}`, stationInfo[idx].uuid, weatherData[station].params[sensor].name, `${stationInfo[idx].title} - ${weatherData[station].params[sensor].name}`).catch();
                            };
                        }
                    }

                    // Inserting measurements


                    for (const uuids of Object.keys(weatherData[station].points)) {
                        for (const timestamps of Object.keys(weatherData[station].points[uuids])) {
                            for (const sensorKey of Object.keys(weatherData[station].points[uuids][timestamps])) {
                                for (const existingSensors of (Object.values(sensors))) {
                                    if (existingSensors.uuid == uuids.slice(1) + ' - ' + sensorKey.slice(1)) {
                                        const SQL = this.SQLUtils.insertMeasurementSQL(existingSensors.id, (parseInt(timestamps.slice(1))-89411160)*60, weatherData[station].points[uuids][timestamps][sensorKey]);
                                        try {
                                            this.SQLUtils.processSQL(SQL);
                                        } catch (e) {
                                            console.log('Error in:', SQL);
                                        };
                                    }
                                }
                            }
                        }
                    }

                    // Sets state if already exists
                    let fromTime = this.config.start_time;
                    if (this.state != {}) {
                        if (this.state[name] !== undefined) {
                            fromTime = moment.unix(this.state[name].lastRecord).toISOString(true);
                        }
                    }

                    // Update datalake repository with the crawled data
                    if (fromTime !== lastMeasure) {
                        CrawlerUtils.saveToDataLake(stationData, fromTime, {
                            dir: this.config.id,
                            type: this.config.log_type,
                            name: name,
                        });
                    }


                    // Update the state with the last crawled timestamp

                    this.updateState(stationList, lastUnix);


                    // Write final state
                    CrawlerUtils.saveState(__dirname, this.state);
                }
                // Crawling next date
                this.timeInterval[0] = moment(this.timeInterval[0]).add(1, 'day').format('YYYY-MM-DD');
            }
        } catch (e) {
            console.log('ERROR:', e);
        }

        console.log('Finishing crawl: ' + this.config.id);
    }


    async getLocationData(base_loc = this.config.url_locations,
        timeInterval = this.timeInterval,
        types = this.config.station_type) {
        const url = base_loc + 'd1=' + timeInterval[0] + '&d2=' + timeInterval[1] + '&type=' + types;
        const body = await CrawlerUtils.getURL(url);
        const $ = cheerio.load(body, {xmlMode: true});
        const stringData = $('pujs').text().slice(17, -2);
        const locationData = JSON.parse(stringData.replace(/(\w+:)|(\w+ :)/g, function(s) {
            return '"' + s.substring(0, s.length-1) + '":';
        }));

        return locationData;
    }

    async getWeatherData(places, url = this.config.url_data, vars = this.config.variables,
        timeInterval = this.timeInterval) {
        const weather = [];
        let i = 0;

        for (const station of places) {
            i++;
            const weatherUrl = url + 'vars=' + vars + '&group=halfhourlyData0&type=halfhourly&id=' + station.uuid + '&d1=' + timeInterval[0] + '&d2=' + timeInterval[0];
            const body = await CrawlerUtils.getURL(weatherUrl);
            const $ = cheerio.load(body, {xmlMode: true});
            const stringData = '{' + $('pujs').text().slice(117, -1);
            const weatherData = JSON.parse(stringData.replace(/(\w+:)|(\w+ :)/g, function(s) {
                return '"' + s.substring(0, s.length-1) + '":';
            }));
            ;
            weather.push(weatherData);
        }

        return weather;
    }


    checkLastCrawl() {
        if (Object.values(this.state).length !== 0) {
            const isEqual = (ts) => ts.lastRecord == (Object.values(this.state)[0].lastRecord);
            const bool = (Object.values(this.state).every(isEqual));
            if (bool) {
                const lastTS = moment.unix(Object.values(this.state)[0].lastRecord);
                this.timeInterval[0] = moment(lastTS).add(1, 'day').format('YYYY-MM-DD');
            } else {
                console.log('Please enter last crawl date manually, state record timestamps do not match.');
                return true;
            }
        } else {
            console.log('No previous crawl, starting fresh.');
            return false;
        }
    }


    findWithAttr(array, attr, value) {
        for (let i = 0; i < array.length; i += 1) {
            if (array[i][attr] === value) {
                return i;
            }
        }
        return -1;
    }


    updateState(stationList, lastRecord) {
        for (const name of stationList) {
            this.state[name] = {'lastRecord': lastRecord};
        }
    }
    /**
     * Loads the datalake data into the database.
     */
    load() {
        // load the data from datalake into the db
    }
}


module.exports = ArsoWeatherSloveniaCrawler;
