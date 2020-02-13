// imports
const fs = require('fs');
const https = require('https');

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
        const dir = __dirname + '/crawlers';
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
            const html = await this.getURLPromise(url);
            return html;
        } catch (e) {
            throw (e);
        }
    }

    /**
     * Wrapper for getting the URL.
     *
     * @param {string} url URL address we are fetching.
     * @return {Promis} Promise to the fetched url data.
     */
    static getURLPromise(url) {
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

                    if (length == docLength) {
                        resolve(html.toString('UTF-8'));
                    }
                });
            }).on('error', (e) => {
                reject(e);
            });
        });
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

        if (config.type === 'hourly') {
            timeId = d.getFullYear() + '-d' + this.getDayOfYear(d) + '-h' + d.getHours();
        } else if (config.type === 'daily') {
            timeId = d.getFullYear() + '-d' + this.getDayOfYear(d);
        } else if (config.type === 'weekly') {
            timeId = d.getFullYear() + '-w' + this.getWeekNumber(d);
        } else if (config.type === 'monthly') {
            timeId = d.getFullYear() + '-m' + (d.getMonth() + 1);
        } else if (config.type === 'yearly') {
            timeId = d.getFullYear();
        }

        const filename = __dirname + '/../data/' + config.dir + '/log-' + timeId + '.ldjson';
        fs.appendFileSync(filename, data + '\n');
    }
}

module.exports = CrawlerUtils;
