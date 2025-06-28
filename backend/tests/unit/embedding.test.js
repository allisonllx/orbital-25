const { generateEmbeddings } = require('../../utils');
const OpenAI = require('openai');

jest.mock('openai');

describe('generateEmbeddings', () => {
  const mockCreate = jest.fn();
  const mockOpenAIInstance = { embeddings: { create: mockCreate } };

  beforeEach(() => {
    OpenAI.mockImplementation(() => mockOpenAIInstance);
  });

  it('returns embedding from OpenAI response', async () => {
    const fakeEmbedding = [0.01, 0.02, 0.03];
    mockCreate.mockResolvedValue({ data: [{ embedding: fakeEmbedding }] });

    const result = await generateEmbeddings('hello world');
    expect(result).toEqual(fakeEmbedding);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'text-embedding-3-small',
      input: 'hello world',
      encoding_format: 'float',
    }));
  });

  it('throws error on API failure', async () => {
    mockCreate.mockRejectedValue(new Error('embedding failed'));
    await expect(generateEmbeddings('bad input')).rejects.toThrow('embedding failed');
  });
});
