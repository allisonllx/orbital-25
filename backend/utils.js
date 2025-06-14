// import { OpenAI } from 'openai';
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbeddings(text) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: 'float',
    });
    return response.data[0].embedding;
}

module.exports = generateEmbeddings;