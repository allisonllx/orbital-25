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
    const num1 = parseInt(id1, 10);
    const num2 = parseInt(id2, 10);

    if (!Number.isInteger(num1) || !Number.isInteger(num2) || num1 <= 0 || num2 <= 0) {
        throw new Error('Both IDs must be positive integers');
    }

    return [num1, num2].sort((a, b) => a - b).join('_');
};

module.exports = { generateEmbeddings, generateRoomId };