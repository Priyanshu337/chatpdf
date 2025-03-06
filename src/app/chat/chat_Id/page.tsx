"use client"
import React from 'react';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import ChatSideBar from '@/components/ui/ChatSideBar';

type Props = {
    params: {
        chatId: string
    }
}

const ChatPage = async ({ params: { chatId } }: Props) => {
    const { userId } = await auth();

    if (!userId) {
        return redirect('/sign-in')
    }

    const _chats = await db.select().from(chats).where(eq(chats.userId, userId));

    if (!_chats) {
        return redirect('/')
    }
    if (!_chats.find(chat => chat.id === parseInt(chatId))) {
        return redirect('/');
    }

    console.log("congrate you are on chat page");
    return (
        <>
            <div className='flex max-h-screen overflow-scroll'>
                <div className='flex w-full max-h-screen overflow-scroll'>
                    {/* chat side bar */}
                    <div className='flex-[1] max-w-xs'>
                        <ChatSideBar chats={_chats} chatId={parseInt(chatId)} />
                    </div>
                    {/* main pdf viever  */}
                    <div className='max-h-screen p-4 overflow-scroll flex-[5]'>
                        {/* <PDFViewer /> */}
                    </div>
                    {/* chat compoent  */}
                    <div className='flex-[3] border-l-4 border-l-slate-200'>
                        {/* <chatComponent /> */}

                    </div>
                </div>

            </div>
        </>
    )
}

export default ChatPage; 