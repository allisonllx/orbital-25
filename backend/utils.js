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

// for real-time chat
const generateRoomId = (id1, id2) => {
    const [low, high] = [id1, id2].sort((a, b) => a - b);
    return `${low}_${high}`;
};

module.exports = { generateEmbeddings, generateRoomId };