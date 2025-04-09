import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
// import { queryObjects } from "v8";
import { getEmbedding } from "./embedding";

export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
    try {

        // i have removed the enviorment form the connection cursor did it if needed wil add it back
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!
        });

        const index = pinecone.index('chatpdf');

        const namespace = convertToAscii(fileKey)
        const queryResult = await index.query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true,
            filter: { namespace }
        });

        return queryResult.matches || [];

    } catch (error) {
        console.log('Error Querying Embedding', error);
        throw error;
    }
}


//below is the getcontext for gettig context of the pddf that is loaded in the chatpdf container that the user is currently working on 
export async function getContext(query: string, fileKey: string) {
    if (!query || typeof query !== 'string') {
        throw new Error('Invalid query input at file coontext line 36');
    }

    if (!fileKey || typeof fileKey !== 'string') {
        throw new Error('Invalid fileKey input at file coontext line 40');
    }

    try {
        const queryEmbedding = await getEmbedding(query);
        const matches = await getMatchesFromEmbeddings(queryEmbedding, fileKey);

        if (!matches || matches.length === 0) {
            return 'No relevant context found.';
        }

        const qualifyingDocs = matches.filter((match) => match.score && match.score > 0.7);

        if (qualifyingDocs.length === 0) {
            return 'No sufficiently relevant context found.';
        }

        type Metadata = {
            text: string,
            pageNumber: number
        }

        let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text);
        return docs.join('\n').substring(0, 3000);
    } catch (error) {
        console.error('Error in getContext:', error);
        throw new Error(`Failed to get context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}