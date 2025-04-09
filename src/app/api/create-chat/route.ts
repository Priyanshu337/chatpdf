// app/api/documents/route.ts
// in this file we are doin following
// we are loading data into pinecone and then creating chat 
// returning chat id so that we can redirect to chat page 

import { NextRequest, NextResponse } from "next/server";
import {
    S3Client,
    ListObjectsCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { getS3Url } from "@/lib/s3";

const Bucket = 'chatpdf-dup'
const s3 = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_1!,
        secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY_1!,
    },
});

// endpoint to get the list of files in the bucket
export async function GET() {
    const response = await s3.send(new ListObjectsCommand({ Bucket }));
    return NextResponse.json(response?.Contents ?? []);
}


export async function POST(req: NextRequest, res: NextResponse) {
    const { userId } = await auth()
    try {
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await req.json()
        const { file_key, file_name } = body;

        // Create the chat first
        const chat_id = await db
            .insert(chats)
            .values({
                fileKey: file_key,
                pdfName: file_name,
                userId,
                pdfUrl: getS3Url(file_key)
            }).returning({
                insertedId: chats.id,
            });

        // Then process the PDF in the background
        try {
            await loadS3IntoPinecone(file_key);
        } catch (pineconeError) {
            console.error("Error processing PDF:", pineconeError);
            // Continue even if Pinecone processing fails
        }

        return NextResponse.json({
            success: true,
            chat_id: chat_id[0].insertedId
        }, {
            status: 200
        });
    }
    catch (error) {
        console.error("Error in API route:", error);
        return NextResponse.json({
            error: "Internal Server error",
        },
            {
                status: 500
            });
    }
}


// this endpoint is also valid you can use this one as well
// export async function POST(request: NextRequest) {
//     const formData = await request.formData();
//     const files = formData.getAll("file") as File[];
//     console.log('files', files);
//     const response = await Promise.all(
//         files.map(async (file) => {
//             // not sure why I have to override the types here
//             const Body = (await file.arrayBuffer()) as Buffer;
//             s3.send(new PutObjectCommand({ Bucket, Key: file.name, Body }));
//         })
//     );

//     return NextResponse.json(response);
// }