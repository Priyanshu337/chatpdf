import AWS from 'aws-sdk';
import { ArrowDownSquare } from 'lucide-react';

export async function UploadToS3(file: File) {
    try {
        AWS.config.update({
            accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY,
            secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
        });
        const s3 = new AWS.S3({
            params: {
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
            },
            region: 'us-east-1'
        })

        // Now the bucket is ready named s3 on our this const

        const file_key = 'uploadedpdf/' + Date.now().toString() + file.name.replace('', '-')
        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: file_key,
            Body: file
        }
        const upload = s3.putObject(params).on('httpUploadProgress', (evt) => {
            console.log("Uploading to S3...",
                parseInt(((evt.loaded * 100) / evt.total).toString()))
        }).promise()

        await upload.then(data => {
            console.log("Sucessfully uploaded to S3!", file_key)
        })
        return Promise.resolve({
            file_key,
            file_name: file.name,

        });
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
}

export function getS3Url(_file_key: string) {
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${_file_key}`;
    return url;
}