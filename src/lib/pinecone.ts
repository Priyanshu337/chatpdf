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
    const file_name = await downloadFromS3(file_key)
    if (!file_name) {
        console.log("Didnt reciveve any filename in loadse3instance", file_name);
    } else {
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

        if (!Array.isArray(vectors) || vectors.length === 0) {
            throw new Error("No valid vectors provided for upsert");
        }

        vectors.forEach(vector => {
            if (!vector.id || !vector.values) {
                throw new Error("Each vector must have `id` and `values` properties");
            }
        });

        for (let i = 0; i < vectors.length; i += chunkSize) {
            // Chunking and upserting
            const chunk = vectors.slice(i, i + chunkSize);
            await pineconeIndex.upsert({
                vectors: chunk,
                namespace,
            });
        }
    } catch (error) {
        console.log(error, "This is the error while performing chunkedUpsert function")
    }
}
async function embedDocument(doc: Document) {
    try {

        const embeddings = await getEmbedding(doc.pageContent);
        // until here working fine getting embeddings 
        const hash = md5(doc.pageContent)
        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }
        } as Vector

    } catch (error) {
        console.log("error on embedDOc on line 37 at pinecone file", error)
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
