const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config()

const app = express();
const cache = new NodeCache({
	stdTTL: 600,
	checkperiod: 120,
});

const apiKey = process.env.API_KEY; // Read Variable from .env file

// Swagger options
const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'News API',
			version: '1.0.0',
			description: 'A simple API to fetch news articles',
		},
		servers: [
			{
				url: 'http://localhost:3000',
				description: 'Development server',
			},
		],
	},
	apis: ['./index.js'],
};

const specs = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /news:
 *   get:
 *     summary: Get top headlines
 *     parameters:
 *       - in: query
 *         name: n
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of articles to fetch (default is 10)
 *     responses:
 *       200:
 *         description: A list of news articles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Article'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
app.get('/news', async (req, res) => {
	const { n = 10 } = req.query;
	const cacheKey = `news-${n}`;

	const cachedData = await cache.get(cacheKey);
	if (cachedData) {
		return res.json(cachedData);
	}

	try {
		const response = await axios.get('https://gnews.io/api/v4/top-headlines', {
			params: {
				token: apiKey,
				lang: 'en',
				max: n,
			},
		});

		const data = response.data.articles.map((article) => ({
			title: article.title,
			description: article.description,
			url: article.url,
			image: article.image,
			publishedAt: article.publishedAt,
			source: {
				name: article.source.name,
				url: article.source.url,
			},
		}));

		cache.set(cacheKey, data);
		return res.json(data);
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			message: 'Something went wrong',
		});
	}
});

/**
 * @swagger
 * /news/find:
 *   get:
 *     summary: Find news articles by title and/or author
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Title of the article to search for
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Author of the article to search for
 *     responses:
 *       200:
 *         description: A list of news articles that match the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
app.get('/news/find', async (req, res) => {
	const { title, author } = req.query;
	const cacheKey = `news-find-${title}-${author}`;
	let articles = await cache.get(cacheKey);
	if (articles) {
		return res.json({ articles });
	}
	try {
		const response = await axios.get('https://gnews.io/api/v4/search', {
			params: {
				q: title,
				token: apiKey,
				lang: 'en',
				max: 1,
				in: `title${author ? `&author=${author}` : ''}`,
			},
		});
		articles = response.data.articles;
		cache.set(cacheKey, articles);
		return res.json({
			articles,
		});
	} catch (error) {
        console.error(error);
		return res.status(500).json({ message: 'Failed to find news article' });
    }
});

/**
 * @swagger
 * /news/search:
 *   get:
 *     summary: Search news articles by keyword
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         required: true
 *         description: Keyword to search for
 *     responses:
 *       200:
 *         description: A list of news articles that match the search keyword
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
app.get('/news/search', async (req, res) => {
	const { keyword } = req.query;
	if (!keyword) {
		return res.status(400).json({
			message: 'Missing search query',
		});
	}

	const cacheKey = `news-search-${keyword}`;
	let articles = await cache.get(cacheKey);
	if (articles) {
		return res.json({ articles });
	}
	try {
		const response = await axios.get('https://gnews.io/api/v4/search', {
			params: {
				q: keyword,
				token: apiKey,
			},
		});
		articles = response.data.articles;
		cache.set(cacheKey, articles);
		return res.json({
			articles,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'Failed to fetch news articles' });
	}
});

// Swagger schema definition for Article
/**
 * @swagger
 * components:
 *   schemas:
 *     Article:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         url:
 *           type: string
 *         image:
 *           type: string
 *         publishedAt:
 *           type: string
 *         source:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             url:
 *               type: string
 */

app.listen(3000, () => console.log(`App listening on port 3000!`));