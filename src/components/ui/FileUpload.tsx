'use client'
import { useMutation } from '@tanstack/react-query';
import { UploadToS3 } from '@/lib/s3'
import { Inbox, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast';
import React from 'react'
import { useState } from 'react'
import axios from 'axios';
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation';


type Props = {}

type S3UploadResponse = {
    file_key: string;
    file_name: string;
};

const FileUpload = (props: Props) => {
    const router = useRouter();
    const [upLoading, setUpLoading] = useState(false);

    // here we will accept the file and send it to api call in route.ts
    const { mutate, status } = useMutation({
        mutationFn: async ({
            file_key,
            file_name,
        }: {
            file_key: string;
            file_name: string;
        }) => {
            // here we are sending data to api to create chat 
            const response = await axios.post('/api/create-chat', {
                file_key,
                file_name
            });
            console.log('This is responose from fileupload stack', response);

            const data = response.data;
            return data;
        },
    });

    // this is to get pdf in input dropzone and then send it to s3 file to upload on bucket.

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            "application/pdf": [".pdf"]
        },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            console.log("Accepted Files", acceptedFiles)
            const file = acceptedFiles[0]
            if (file.size > 10 * 1024 * 1024) {
                //  if big than 10mb
                toast.error('File too large');
                return
            }
            // above this line we accepted the file and then we will upload to S3
            try {
                setUpLoading(true);
                const data: S3UploadResponse = await UploadToS3(file);
                if (!data.file_key || !data.file_name) {
                    toast.error('something went wrong');
                    return;
                }
                //After uploading to S3 we will send it to  mutate function the file key and file name so that will send the data to api 

                const normalizedFileKey = data.file_key.normalize('NFC') as string;
                const normalizedFileName = data.file_name.normalize('NFC') as string;

                // here we are passing filekey and filename to mutate function 
                mutate({ file_key: normalizedFileKey, file_name: normalizedFileName }, {

                    onSuccess: ({ chat_id }) => {
                        console.log(chat_id, "here is the chat id ");
                        toast.success('chat created');
                        router.push(`/chat/${chat_id}`);

                    },
                    onError: (err: any) => {
                        toast.error('Error creating chat', err);
                    }
                })
            } catch (error) {
                console.log(error)
            } finally {
                setUpLoading(false);
            }
        }
    })

    return (
        <div className=' p-2 bg-white rounded-xl'>
            <div
                {...getRootProps({
                    className: 'bordere-dashed border-2 rounded-xl cursor-pointer bg-grey-50 py-8 flex justify-center item-center flex-col'
                })}>
                < input {...getInputProps} />

                {(upLoading || status) ? (
                    <>
                        <Loader2 className='h-10 w-10 text-blue-500 animate-spin' />
                        <p className='mt-2 text-sm text-slate-400'>Spilling tea to Gpt</p>
                    </>
                ) : (
                    <>
                        <Inbox className="w-110 h-10 ml-60 text-blue-500 " />
                        <p className='mt-2 text-sm text-slate-400'> Drop PDF Here</p>
                    </>

                )}
            </div>
        </div >
    )
}

export default FileUpload; 