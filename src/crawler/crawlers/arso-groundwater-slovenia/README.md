# rapids-iot crawlers
A crawler for web resources for `rapids-iot`.

The crawler directory includes:

* `config.json` file / config parameters for the parser.
* `crawler.js` file / main crawler file containing Crawler class, which exposes two methods `crawl()` (crawling the web resource) and `load()` (loading data from data lake to database).
* `state.json` file holding the current state of the crawler.

Each crawler should be able to rebuild the db structure from data lake.