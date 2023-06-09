# News API

A simple API to fetch news articles from the [gNews](https://gnews.io) API.

## Setup

1. Install dependencies: `npm install`
2. Set your gNews API key as an environment variable in .env file: `API_KEY=your_api_key`
3. Start the server: `npm start`

## Usage

The API has three endpoints:

- `/news`: Fetch top news
- `/news/find`: Find a news article by specific title and/or author
- `/news/search`: Search news articles by keyword

By default, the API will cache the results for 10 minutes using the `node-cache` package. 

### Swagger documentation

You can view the Swagger documentation for the API by going to the `/api-docs` endpoint in your browser. The documentation is generated using the `swagger-jsdoc` and `swagger-ui-express` packages.