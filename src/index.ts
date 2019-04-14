process.env.PORT = "3001";

import * as express from "express";
import { ShoppingApp } from "./shopping";
import * as bluebird from "bluebird";

const RedisServer = require("redis-server");
const Redis = require("redis");

/**
 * Main class.
 */
export class Main {
    public async start() {
        console.log("Starting the catalog and shopping cart API");

        // Start a redis server to cache the cart states.
        const redisServer = new RedisServer(6379);
        redisServer.open((err: any) => {
            if (err) {
                console.log("Redis server error: " + err);
            }
        });

        const redisOptions: any = {
            host: "localhost",
            port: 6379
        };
        const redisClient = Redis.createClient(redisOptions);
        redisClient.on("error", function (err: any) {
            console.error("Redis client error: " + err);
        });

        const main = new ShoppingApp(bluebird.promisifyAll(redisClient));

        const app = express();
        app.use("/api", main.getRouter());

        app.get("/api", (req, res, next) => {
            res.status(200).send(main.getRouter().stack);
        });

        app.listen(3000);

        console.log("Catalog and shopping cart has started");
    }
}

new Main().start();
