# rapids-iot crawlers
A crawler for web resources for `rapids-iot`.

The crawler directory includes:

* `crawler.json` file / config parameters for the parser.
* `crawler.js` file / main crawler file.
* `load.js` file / load/transformer from data lake files into database.

Each crawler should be able to rebuild the db structure from data lake.