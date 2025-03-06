import AWS from "aws-sdk";
import fs from 'fs';
import path from 'path';

export async function downloadFromS3(file_key: string) {
    try {
        AWS.config.update({
            accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY!,
            secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
        });
        const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
        if (!bucketName) {
            throw new Error("S3 bucket name is not defined in environment variables.");
        }
        const s3 = new AWS.S3({
            params: {
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
            },
            region: 'us-east-1'
        })
        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: file_key,
        }


        const objStream = s3.getObject(params).createReadStream(); // Create a readable stream

        const fileName = `/tmp/pdf-${Date.now()}.pdf`;
        const filePath = path.resolve(fileName); // Resolve the full path

        // Pipe the stream to a writable file stream
        const writeStream = fs.createWriteStream(filePath);
        objStream.pipe(writeStream);

        // Return a promise that resolves when the writing is complete
        return new Promise<string>((resolve, reject) => {
            writeStream.on('finish', () => resolve(filePath));
            writeStream.on('error', (error) => reject(error));
        });


        // const obj = await s3.getObject(params).createReadStream();

        // const file_name = `/tmp/pdf-${Date.now()}.pdf`
        // fs.writeFileSync(file_name, obj.Body as Buffer)
        // return file_name


    } catch (error) {
        console.log("THis is error from download from s3 function ", error);

    }
}
