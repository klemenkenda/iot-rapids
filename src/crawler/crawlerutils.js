const fs = require('fs');

class CrawlerUtils {
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
            fs.createReadStream(dirname + '/state.json')
                .pipe(fs.createWriteStream(dirname + '/state.old.json'));
        }

        return state;
    }

    static saveState(dirname, state) {
        const json = JSON.stringify(state, 4);
        fs.writeFileSync(dirname + '/state.json', json);
    }

    static loadConfig(dirname) {
        const json = fs.readFileSync(dirname + '/crawler.json');
        const config = JSON.parse(json);
        return config;
    }
}

module.exports = CrawlerUtils;