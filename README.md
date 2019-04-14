# vet_radar_task
This repo is for designing and writing a headless catalog and shopping cart API.
Open API (swagger) can be used here for better Doc and validation.

## How to use
- npm i

- gulp

- npm start

## Available APIs.
- GET http://localhost:3000/api  a list of available APIs

- GET http://localhost:3000/api/products  retrieve the catalog

- GET http://localhost:3000/api/carts/:userId  retrieve a specific user's cart

- PUT http://localhost:3000/api/carts/:userId/:product  add a product to user's cart

- DELETE http://localhost:3000/api/carts/:userId/:product delete a product from user's cart

