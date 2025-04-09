//  in  this file we are doing following things 
//  we are using loadder from langchain to divide pdf into pages
// then transforming them into document
// pushing all the documents into pinecone DB
// then returning data to create-chat/route file





import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter'
import { getEmbedding } from './embedding';
import md5 from 'md5';
import { metadata } from '@/app/layout';
import { convertToAscii } from './utils';

type Vector = {
    id: string; // Unique identifier for the vector
    values: number[]; // Array of numerical values
    metadata?: Record<string, any>; // Optional metadata
};


export const getPineconeClient = async () => new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!
});

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: { pageNumber: number };
    };
};


export async function loadS3IntoPinecone(file_key: string) {
    try {
        const file_name = await downloadFromS3(file_key)
        if (!file_name) {
            console.log("Didn't receive any filename in loadS3IntoPinecone", file_name);
            return null;
        }

        const loader = new PDFLoader(file_name);
        const pages = (await loader.load()) as PDFPage[];

        //split the pdf
        const documents = await Promise.all(pages.map(prepareDocument));

        // vectorise and embed individual docs
        const vectors = (await Promise.all(documents.flat().map(embedDocument))).filter(Boolean);

        // now we will load data into pinecone db 
        const client = await getPineconeClient();
        const pineconeIndex = client.Index('chat-pdf')
        const namespace = convertToAscii(file_key);

        const chunkSize = 10
        await chunkedUpsert(pineconeIndex, vectors.filter(Boolean) as Vector[], namespace, chunkSize);
        return pages;
    } catch (error) {
        console.error("Error in loadS3IntoPinecone:", error);
        throw error; // Re-throw to handle in the API route
    }
}


// Custom chunkedUpsert function
async function chunkedUpsert(
    pineconeIndex: any,
    vectors: Vector[],
    namespace: string,
    chunkSize: number
) {
    try {
        // Validate input vectors
        if (!Array.isArray(vectors)) {
            throw new Error("Vectors must be an array");
        }

        // Filter out any null or undefined vectors
        const validVectors = vectors.filter(vector =>
            vector &&
            vector.id &&
            vector.values &&
            Array.isArray(vector.values) &&
            vector.values.length > 0
        );

        if (validVectors.length === 0) {
            console.warn("No valid vectors to upsert after filtering");
            return;
        }

        for (let i = 0; i < validVectors.length; i += chunkSize) {
            const chunk = validVectors.slice(i, i + chunkSize);

            try {
                await pineconeIndex.upsert({
                    vectors: chunk,
                    namespace
                });
            } catch (chunkError) {
                console.error(`Error upserting chunk ${i / chunkSize}:`, chunkError);
                // Continue with next chunk instead of failing completely
                continue;
            }
        }
    } catch (error) {
        console.error("Error in chunkedUpsert:", error);
        throw error;
    }
}

async function embedDocument(doc: Document) {
    try {
        if (!doc || !doc.pageContent) {
            console.warn("Invalid document provided to embedDocument");
            return null;
        }

        const embeddings = await getEmbedding(doc.pageContent);
        if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
            console.warn("Invalid embeddings received for document");
            return null;
        }

        const hash = md5(doc.pageContent);
        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }
        } as Vector;
    } catch (error) {
        console.error("Error in embedDocument:", error);
        return null;
    }
}


export const turncateStringByBytes = (str: string, bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder('UTF-8').decode(enc.encode(str).slice(0, bytes));
}

export async function prepareDocument(page: PDFPage) {
    const { pageContent: rawPageContent, metadata } = page; // Correctly destructuring the object

    const pageContent = rawPageContent.replace(/\n/g, ''); // R
    // let [pageContent, metadata] = page
    // pageContent = pageContent.replace(/\n/g, '')
    //split the docs
    const splitter = new RecursiveCharacterTextSplitter()
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: turncateStringByBytes(pageContent, 36000)
            }
        })
    ])
    return docs
}
