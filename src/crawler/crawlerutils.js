const fs = require('fs');

class CrawlerUtils {
    static loadState(dirname) {
        const json = fs.readFileSync(dirname + '/state.json');
        const state = JSON.parse(json);
        return state;
    }

    static saveState(dirname, state) {
        const json = JSON.stringify(state, 4);
        fs.writeFileSync(dirname + '/state.json', json);
    }
}

module.exports = CrawlerUtils;