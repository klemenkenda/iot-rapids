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
     */
    static loadState(dirname) {
        let json = "{}";
        let state = {};

        try {
            json = fs.readFileSync(dirname + '/state.json');
        } catch(e) {
            console.log("State file not read!");
        }

        try {
            state = JSON.parse(json);
        } catch(e) {
            console.log("Error parsing state JSON. Saving a copy to state.old.json.")
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
     */
    static loadConfig(dirname) {
        const json = fs.readFileSync(dirname + '/config.json');
        const config = JSON.parse(json);
        return config;
    }

    /**
     * Reads config.json and state.json and returns it for all the crawles
     * in the ./crawlers directory.
     */
    static getCrawlers() {
        // transverse crawlers folder
        let dir = __dirname + "/crawlers";
        let crawlers = [];
        let list = fs.readdirSync(dir);
        list.forEach((el, i) => {
            crawlers.push({
                dir: dir + "/" + el,
                config: this.loadConfig(dir + "/" + el),
                state: this.loadState(dir + "/" + el),
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
        } catch(e) {
            throw(e);
        }
    }

    static getURLPromise(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                if (res.statusCode != 200) {
                    reject(new Error('Wrong HTTP status code ' + res.statusCode));
                }

                // repeat until desired length is received
                // TODO: handle timeouts!
                const doc_length = res.headers['content-length'];
                let length = 0;
                let html = "";
                res.on('data', d => {
                    length += d.length;
                    html += d;

                    if (length == doc_length) {
                        resolve(html.toString('UTF-8'));
                    }
                })
            }).on('error', (e) => {
                reject(e);
            })
        })
    }

}

module.exports = CrawlerUtils;