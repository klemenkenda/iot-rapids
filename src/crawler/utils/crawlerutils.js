// imports
const fs = require('fs');
const https = require('https');
const request = require('request');
const JSONstat = require('jsonstat-toolkit') // handline JSONstat format

/**
 * A class for different utils for working with crawlers in
 * rapids-iot.
 */
class CrawlerUtils {
    /**
     * Loads crawler's state from the corresponding directory.
     *
     * @param {string} dirname Current crawler directory name.
     * @return {json} Loaded state.
     */
    static loadState(dirname) {
        let json = '{}';
        let state = {};

        try {
            json = fs.readFileSync(dirname + '/state.json');
        } catch (e) {
            console.log('State file not read! New one will be created after save.');
        }

        try {
            state = JSON.parse(json);
        } catch (e) {
            console.log('Error parsing state JSON.' +
                + 'Saving a copy to state.old.json.');
            fs.createReadStreamSync(dirname + '/state.json')
                .pipe(fs.createWriteStream(dirname + '/state.old.json'));
        }

        return state;
    }

    /**
     * Saves the state in a state.json file in the corresponding directory.
     *
     * @param {string} dirname Current crawler directory name.
     * @param {json} state State JSON.
     */
    static saveState(dirname, state) {
        const json = JSON.stringify(state, null, 4);
        fs.writeFileSync(dirname + '/state.json', json);
    }

    /**
     * Reads the config file in the corresponding directory.
     *
     * @param {string} dirname Current crawler directory name.
     * @return {json} Config JSON.
     */
    static loadConfig(dirname) {
        const json = fs.readFileSync(dirname + '/config.json');
        const config = JSON.parse(json);
        return config;
    }

    /**
     * Reads config.json and state.json and returns it for all the crawles
     * in the ./crawlers directory.
     *
     * @return {any} Array of crawlers.
     */
    static getCrawlers() {
        // transverse crawlers folder
        const dir = __dirname + '/../crawlers';
        const crawlers = [];
        const list = fs.readdirSync(dir);
        list.forEach((el, i) => {
            crawlers.push({
                dir: dir + '/' + el,
                config: this.loadConfig(dir + '/' + el),
                state: this.loadState(dir + '/' + el),
            });
        });

        return crawlers;
    }

    /**
     * Returns data from URL. Uses auxilary functin getURLPromise(url).
     * See below.
     *
     * @param {string} url URL to retrieve data from.
     */
    static async getURL(url) {
        try {
            console.log('Retrieving ' + url);
            if (/^https:/.test(url)) {
                const html = await this.getURLPromiseHTTPS(url);
                return html;
            } else {
                const html = await this.getURLPromiseHTTP(url);
                return html;
            }
        } catch (e) {
            throw (e);
        }
    }

    /**
     * Returns data from URL. Uses auxilary functin postURLPromise(url).
     * See below.
     *
     * @param {string} url URL to post data to.
     * @param {object} data JSON object to be posted.
     */
    static async postURL(url, data) {
        try {
            const result = await this.postURLPromise(url, data);
            return result;
        } catch (e) {
            throw (e);
        }
    }

    /**
     * Wrapper for getting the URL.
     *
     * @param {string} url URL address we are fetching.
     * @return {Promise} Promise to the fetched url data.
     */
    static getURLPromiseHTTPS(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                if (res.statusCode != 200) {
                    reject(new Error('Wrong HTTP status code ' + res.statusCode));
                }

                // repeat until desired length is received
                // TODO: handle timeouts!
                const docLength = res.headers['content-length'];

                let length = 0;
                let html = '';
                res.on('data', (d) => {
                    length += d.length;
                    html += d;
                });

                res.on('end', () => {
                    resolve(html.toString('UTF-8'));
                });
            }).on('error', (e) => {
                reject(e);
            });
        });
    }

    /**
     * Wrapper for getting the URL.
     *
     * @param {string} url URL address we are fetching.
     * @return {Promise} Promise to the fetched url data.
     */
    static getURLPromiseHTTP(url) {
        return new Promise((resolve, reject) => {
            request(url, (_err, res, body) => {
                if (_err !== null) {
                    reject(new Error('Undefined error retrieving data, result is not defined:' + _err.Error));
                }

                if (res.statusCode !== 200) {
                    reject(new Error('Wrong HTTP status code ' + res.statusCode));
                }

                resolve(body.toString('UTF-8'));
            }).on('error', (e) => {
                reject(e);
            });
        });
    }

    /**
     * Wrapper for making a POST request to the URL with JSON.
     *
     * @param {string} url URL address we are posting the JSON object to.
     * @param {object} json JSON object to be posted.
     * @return {Promise} Promise to the fetched url data.
     */
    static postURLPromise(url, json) {
        return new Promise((resolve, reject) => {
            request.post(url, { json: json }, (_err, res, body) => {
                if (_err !== null) {
                    reject(new Error('Undefined error retrieving data, result is not defined:' + _err.Error));
                }

                if (res.statusCode !== 200) {
                    reject(new Error('Wrong HTTP status code ' + res.statusCode));
                }

                resolve(body);
            }).on('error', (e) => {
                reject(e);
            });
        });
    }


    /**
     * Wrapper for making a JSONStat request.
     *
     * @param {string} url URL address we are posting the JSON object to.
     * @param {object} options JSONStat request options.
     * @return {Promise} Promise to the fetched JSONStat dataset.
     */
    static JSONStatPromise(url, options) {
        return new Promise((resolve, reject) => {
            JSONstat(url, options).then((j) => {
                resolve(j);
            }).catch((e) => {
                reject(e);
            })
        });
    }

    /**
     * Builds a JSON-Stat query based on the table data from provided URL and field restrictions.
     *
     * @param {string} url URL address of the PxWeb table.
     * @param {object} restrictions Object with field names as keys and arrays of values to be kept as values. The array can be empty in order to ignore a field.
     * @return {object} The build query to be used to select required data from the table.
     */
    static async buildJSONStatQuery(url, restrictions) {
        const rawData = await this.getURL(url);
        const tableStructure = JSON.parse(rawData);
        let query = {
            "query": [
            ],
            "response": {
              "format": "json-stat"
            }
        };
        for (let variable of tableStructure.variables) {
            let selection = {
                "selection": {
                  "filter": "item",
                  "values": [
                  ]
                }
            };
            selection.code = variable.code;
            if (restrictions === undefined || restrictions[variable.code] === undefined) {
                selection.selection.values = variable.values;
            } else {
                selection.selection.values = restrictions[variable.code];
            };
            query.query.push(selection);
        };
        return query;
    }

    static getLabelDict(j, metric) {
        return j.Dataset(0).__tree__.dimension[metric].category.label; // returns a dictionary of API's ID's mapped to human-readable names
    }

    static createSensorTypesFromJSONStat(DBuuid, shortDBName, j) {
        // returns arrays of sensor type UIDs and sensor type names based on the input data.
        // TODO: write tests

        let sensorUIDs = [DBuuid];
        let sensorNames = [shortDBName];

        let columns = j.Dataset(0).role.classification;

        if (columns.size == 0) console.error('Invalid dataset!');

        function combine(previousUIDs, previousNames, columnDict) {
            let outputUIDs = [];
            let outputNames = [];
            for (let i = 0; i < previousUIDs.length; i++) {
                for (let key in columnDict) {
                    outputUIDs.push(previousUIDs[i] + '-' + key);
                    outputNames.push(previousNames[i] + ' 🡒 ' + columnDict[key]);
                }
            }
            return [outputUIDs, outputNames];
        }

        for (var col of columns) {
            const columnDict = CrawlerUtils.getLabelDict(j, col);
            [sensorUIDs, sensorNames] = combine(sensorUIDs, sensorNames, columnDict);
            /*
            for (var key in cdict) {
                var UIDs_tmp = [];
                var names_tmp = [];
                for (var i = 0; i < stypes.UIDs.length; i++) {
                    UIDs_tmp.push(stypes.UIDs[i] + '-' + key);
                    names_tmp.push(stypes.names[i] + '/' + cdict[key]);
                }
                stypes.UIDs = UIDs_tmp;
                stypes.names = names_tmp;
            }*/
        }
        return {uids: sensorUIDs, names: sensorNames, cols: columns};
    }

    /**
     * Gets week number in a year.
     * @param {date} d Date for which we seek week number.
     * @return {number} Week number.
     */
    static getWeekOfYear(d) {
        // Copy date so don't modify original
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        // Get first day of year
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        // Calculate full weeks to nearest Thursday
        const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
        // Return array of year and week number
        return weekNo;
    }

    /**
     * Returns day of in the year.
     * @param {Date} d Date you want to extract day of year.
     * @return {number} Day of year.
     */
    static getDayOfYear(d) {
        const start = new Date(d.getFullYear(), 0, 0);
        const diff = (d - start) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);
        return day;
    }

    /**
     * Saves data to correct data lake based on config.
     *
     * @param {string} data Data to be written to file.
     * @param {number} ts Unix timestamp of the first record of the batch.
     * @param {any} config JSON containing data for logging.
     */
    static saveToDataLake(data, ts, config) {
        const d = new Date(ts);
        let timeId = '';
        let name = '';

        if (config.type === 'hourly') {
            timeId = d.getFullYear() + '-d' + this.getDayOfYear(d) + '-h' + d.getHours();
        } else if (config.type === 'daily') {
            timeId = d.getFullYear() + '-d' + this.getDayOfYear(d);
        } else if (config.type === 'weekly') {
            timeId = d.getFullYear() + '-w' + this.getWeekOfYear(d);
        } else if (config.type === 'monthly') {
            timeId = d.getFullYear() + '-m' + (d.getMonth() + 1);
        } else if (config.type === 'yearly') {
            timeId = d.getFullYear();
        }

        if (config.name !== null) {
            name = config.name + '-';
        }

        const filename = __dirname + '/../../data/' + config.dir + '/log-' + name + timeId + '.ldjson';

        if (!fs.existsSync(__dirname + '/../../data/' + config.dir)) {
            fs.mkdirSync(__dirname + '/../../data/' + config.dir);
        }

        fs.appendFileSync(filename, data + '\n');
    }
}

module.exports = CrawlerUtils;
