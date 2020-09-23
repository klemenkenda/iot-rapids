// imports
const CrawlerUtils = require('../../utils/crawlerutils');

// external imports
// const cheerio = require('cheerio'); // handling DOM

const moment = require('moment'); // handling time
const JSONstat = require('jsonstat-toolkit') 
const SQLUtils = require('../../utils/sqlutils.js');

/**
 * Class for template crawler.
 */
class SiStatCrawler {
    /**
     * Responsible for loading state
     */
    constructor(id) {
        // loading config
        this.config = CrawlerUtils.loadConfig(__dirname);
        // do not load state here
        this.SQLUtils = new SQLUtils();
        this.SQLUtils.getSensorTypes();
        for (let x=0; x<this.config.length; x++) {
            if (id === this.config[x].id) {
                this.config = CrawlerUtils.loadConfig(__dirname)[x];
                return
            }
        }
        console.error("Wrong crawler id!")
    }

    static getTs(t) {
        if (t.match(/\d{4}M\d{2}/)) { // parse format like 2020M03
            const year = t.substring(0, 4);
            const month = parseInt(t.substring(5));
            return moment(year).add(month, 'M').unix();
        }
        if (t.match(/\d{4}Q\d{2}/)) { // parse format like 2020Q01
            const year = t.substring(0, 4);
            const quarter = parseInt(t.substring(5));
            return moment(year).add(3 * quarter, 'M').unix();
        }
        return moment(t).unix();
    }

    static getLocation() {
        return {'x': 15, 'y': 45}
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
        this.state = CrawlerUtils.loadState(__dirname); // load state here as state would be overwritten if multiple crawlers are used

        try {
            const places = await this.SQLUtils.getPlaces();
            const nodes = await this.SQLUtils.getNodes();
            let sensors = await this.SQLUtils.getSensors(); 
            let sensorTypes = await this.SQLUtils.getSensorTypes();

            const url = this.config.url; // TODO: Make URLs, labels and metrics easily-configurable arrays
            const shortDBName = this.config.short_db_name;
            const DBuuid = this.config.db_uuid;
            const restrictions = this.config.restrictions;
            const query = await CrawlerUtils.buildJSONStatQuery(url, restrictions);

            let options = {
                method: 'POST',
                redirect: 'follow',
                body: JSON.stringify(query)
            }
            
            let j = await CrawlerUtils.JSONStatPromise(url, options);
            
            const newSensorTypes = CrawlerUtils.createSensorTypesFromJSONStat(DBuuid, shortDBName, j);
            const sensorTypeUIDs = newSensorTypes.uids;
            const sensorTypeNames = newSensorTypes.names;
            const measurementColumns = newSensorTypes.cols;
            
            // Update sensor types
            for (let i = 0; i < sensorTypeUIDs.length; i++) {
                // Does this sensor type exist?
                const currentSensorType = sensorTypes.filter(x => x.uuid === sensorTypeUIDs[i]);
                if (currentSensorType.length === 0) {
                    let uom = 'count';
                    let re = sensorTypeNames[i].match(/(.*)\[(.*)\]/);
                    if(re != null && re[2] != undefined) {
                        uom = re[2]; // automatically determine unit of measurement (usually written in square brackets)
                    }
                    await this.SQLUtils.insertSensorType(sensorTypeUIDs[i], sensorTypeUIDs[i], uom, sensorTypeNames[i]);
                }
            }

            let geoDimension = j.Dataset(0).role.geo; // e.g. "OBČINE", "KOHEZIJSKI REGIJI" ...
            let timeDimension = j.Dataset(0).role.time; // e.g. "LETO" (year)
            if ((geoDimension && geoDimension.length > 1) || timeDimension.length != 1) {
                throw new Error("Can't handle dataset (too many geoDimensions or timeDimensions)");
            }
            timeDimension = timeDimension[0];
            var locations = {};


            j.Dataset(0).toTable({ type: 'arrobj', content: 'id' }, (data, _) => {
                        let currentRegion = '0'; // default region (Slovenia) if there is no geoDimension
                        if (geoDimension && geoDimension.length > 0) currentRegion = data[geoDimension[0]];
                        let currentSensor = DBuuid;
                        for (let c of measurementColumns) {
                            currentSensor += '-' + data[c];
                        };
                        const stateRegionKey = 'lastTs_' + DBuuid + '_' + currentRegion + '_' + currentSensor;
                        if (this.state[stateRegionKey] === undefined) {
                            this.state[stateRegionKey] = 0;
                        }
                        const lastTs = SiStatCrawler.getTs(data[timeDimension]);

                        if (lastTs > this.state[stateRegionKey]) {
                            // A new data point!
                            this.state[stateRegionKey] = lastTs; // update most recent year
                            if (locations[currentRegion] === undefined) {
                                locations[currentRegion] = {};
                            }
                            
                            const obj = { 'ts': lastTs , 'val': data.value};
                            if (locations[currentRegion][currentSensor] === undefined) {
                                locations[currentRegion][currentSensor] = [];
                            };
                            locations[currentRegion][currentSensor].push(obj);
                            //return { ts: moment(d.LETO).unix(), location: d.OBČINE, value: d.value };
                        };
                    }
            );
            let regionsDict = {'0': 'SLOVENIJA'}
            if (geoDimension) regionsDict = j.Dataset(0).Dimension(geoDimension[0]).__tree__.category.label;
            
            sensors = await this.SQLUtils.getSensors(); 
            let insertQuery = '';
            for (let location of Object.keys(locations)) {
                const loc_id = this.config.geo_metric_uuid + '_' + regionsDict[location];
                const loc = places.filter(x => x.uuid === loc_id);
                if (loc.length === 0) {
                    const loc_title = this.config.geo_metric_uuid + ' ' + regionsDict[location];
                    const geo = SiStatCrawler.getLocation();
                    await this.SQLUtils.insertPlace(this.config.id, loc_id, loc_title, geo.x, geo.y)
                }
                const node_uuid = 'si_stat_' + this.config.db_uuid + location;
                const node = nodes.filter(x => x.uuid === node_uuid);

                if (node.length === 0) {
                    await this.SQLUtils.insertNode(node_uuid, loc_id, 'SI STAT: ' + this.config.short_db_name + ': ' + regionsDict[location]);
                };

                for (let sensor_type of Object.keys(locations[location])) {
                    const sensor_uuid = sensor_type + '_' + location;
                    let sensor = sensors.filter(x => x.uuid == sensor_uuid);
                    if (sensor.length === 0) {
                        await this.SQLUtils.insertSensor(sensor_uuid, node_uuid, sensor_type, sensor_type + ' v ' + regionsDict[location]);
                        sensors = await this.SQLUtils.getSensors();
                        sensor = sensors.filter(x => x.uuid === sensor_uuid)
                    }
                };
            };

            sensors = await this.SQLUtils.getSensors();

            for (let location of Object.keys(locations)) { // have to do another loop as sensors are not properly refreshed otherwise for some reason
                for (let sensor_type of Object.keys(locations[location])) {
                    const sensor_uuid = sensor_type + '_' + location;
                    let sensor = sensors.filter(x => x.uuid == sensor_uuid);
                    const records = locations[location][sensor_type];
                    for (let record of records) {
                        insertQuery += this.SQLUtils.insertMeasurementSQL(sensor[0].id, record.ts, record.val)
                    }
                };
            };

            console.log("Inserting measurements.")
            await this.SQLUtils.processSQL(insertQuery);
            console.log("Finished inserting measurements.")
            
            // write final state

            CrawlerUtils.saveState(__dirname, this.state);
            
        } catch(e) {
            console.error(e)
        }
        
        console.log('Finishing crawl: ' + this.config.id);
    
    }

    /**
     * Loads the datalake data into the database.
     */
    load() {
        // load the data from datalake into the db
    }
}

module.exports = SiStatCrawler;
