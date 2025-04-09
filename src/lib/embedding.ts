import { OpenAIApi, Configuration } from 'openai-edge'

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(config);

export async function getEmbedding(text: string) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input for embedding');
    }

    try {
        const cleanText = text.replace(/\n/g, ' ').trim();
        if (!cleanText) {
            throw new Error('Text is empty after cleaning');
        }

        const response = await openai.createEmbedding({
            model: 'text-embedding-ada-002',
            input: cleanText
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.data || !result.data[0] || !result.data[0].embedding) {
            throw new Error('Invalid response format from OpenAI');
        }

        return result.data[0].embedding as number[];

    } catch (error) {
        console.error("Error generating embedding:", error);
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}