import * as express from "express";

/**
 * App router which exposes catalog and shopping cart API.
 */
export class ShoppingApp {

    private readonly productPrices: any;
    private readonly REDIS_CART_KEY_PREFIX = "cart:";

    public constructor(private redisClient: any) {

        this.productPrices = {
            Sledgehammer: 125.76,
            Axe: 190.51,
            Bandsaw: 562.14,
            Chisel: 13.9,
            Hacksaw: 19.45
        };
    }

    public getRouter(): express.Router {
        const router = express.Router();

        // Get the catalog
        router.get("/products/", (req, res, next) => {
            res.status(200).json(this.productPrices);
        });

        // Get a user's cart, this user identity should be a unique key id but different with username.
        router.get("/carts/:userId", async (req, res, next) => {
            try {
                const cart = await this.redisClient.getAsync(`${this.REDIS_CART_KEY_PREFIX}${req.params.userId}`);
                if (cart) {
                    res.status(200).json(JSON.parse(cart));
                } else {
                    res.status(404).send();
                }
            } catch (err) {
                console.error(err);
                res.status(500).send(err.message);
            }
        });

        // Add a product to a user's cart.
        router.put("/carts/:userId/:product", async (req, res, next) => {
            try {
                const product = req.params.product;
                if(!this.productPrices[product]) {
                    return res.status(400).send("No such product.");
                }

                const cart = await this.redisClient.getAsync(`${this.REDIS_CART_KEY_PREFIX}${req.params.userId}`);
                let cartObject: any;
                if (cart) {
                    cartObject = JSON.parse(cart);
                    if (cartObject[product]) {
                        cartObject[product].quantity = Number.parseInt(cartObject[product].quantity) + 1;
                        cartObject[product].total = this.roundPrice(Number.parseFloat(cartObject[product].total) + this.productPrices[product]);
                        cartObject["total"] = this.roundPrice(Number.parseFloat(cartObject.total) + this.productPrices[product]);
                    } else {
                        cartObject[product] = this.createProduct(product);
                        cartObject["total"] = this.roundPrice(Number.parseFloat(cartObject.total) + this.productPrices[product]);
                    }
                } else {
                    cartObject = {};
                    cartObject[product] = this.createProduct(product);
                    cartObject["total"] = this.roundPrice(this.productPrices[product]);
                }
                await this.redisClient.set(`${this.REDIS_CART_KEY_PREFIX}${req.params.userId}`, JSON.stringify(cartObject), 'EX', 24 * 60 * 60);
                res.status(200).send();
            } catch (err) {
                console.error(err);
                res.status(500).send(err.message);
            }
        });

        // Delete a product from a user's cart.
        router.delete("/carts/:userId/:product", async (req, res, next) => {
            try {
                const cart = await this.redisClient.getAsync(`${this.REDIS_CART_KEY_PREFIX}${req.params.userId}`);
                if (!cart) {
                    return res.status(404).send("No cart for this user.");
                }

                const product = req.params.product;
                if(!this.productPrices[product]) {
                    return res.status(400).send("No such product.");
                }

                let cartObject = JSON.parse(cart);
                if (cartObject[product]) {
                    const quantity = Number.parseInt(cartObject[product].quantity);
                    if (quantity === 1) {
                        delete cartObject[product];
                        cartObject["total"] = this.roundPrice(Number.parseFloat(cartObject.total) - this.productPrices[product]);
                        // if the cart is empty, the Redis entry can be removed here.
                    } else {
                        cartObject[product].quantity = quantity - 1;
                        cartObject[product].total = this.roundPrice(Number.parseFloat(cartObject[product].total) - this.productPrices[product]);
                        cartObject["total"] = this.roundPrice(Number.parseFloat(cartObject.total) - this.productPrices[product]);
                    }
                    await this.redisClient.set(`${this.REDIS_CART_KEY_PREFIX}${req.params.userId}`, JSON.stringify(cartObject), 'EX', 24 * 60 * 60);
                }

                res.status(200).send();
            } catch (err) {
                console.error(err);
                res.status(500).send(err.message);
            }
        });

        return router;
    }

    private createProduct(product: string): any {
        return {
            quantity: 1,
            total: this.roundPrice(this.productPrices[product])
        }
    }

    private roundPrice(price: number): number {
        return Math.round(price * 100) / 100;
    }
}
