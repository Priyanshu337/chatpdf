import React from 'react';
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import ChatSideBar from '@/components/ui/ChatSideBar';
import PDFViewer from '@/components/ui/PDFViewer';
import ChatComponent from '@/components/ui/ChatComponent';

type Props = {
    params: {
        chat_id: string
    }
}

const ChatPage = async ({ params }: Props) => {
    const user = await currentUser();
    const chatId = parseInt(params.chat_id);

    if (!user) {
        return redirect('/sign-in')
    }

    const _chats = await db.select().from(chats).where(eq(chats.userId, user.id));

    if (!_chats) {
        return redirect('/')
    }
    if (!_chats.find(chat => chat.id === chatId)) {
        return redirect('/');
    }
    const currentChat = _chats.find(chat => chat.id == chatId)

    return (
        <>
            <div className='flex max-h-screen overflow-scroll' >
                <div className='flex w-full max-h-screen overflow-scroll' >
                    {/* chat side bar */}
                    <div className='flex-[1] max-w-xs' >
                        <ChatSideBar chats={_chats} chatId={chatId} />
                    </div>
                    {/* main pdf viewer  */}
                    <div className='max-h-screen p-4 overflow-scroll flex-[5]' >
                        <PDFViewer pdf_url={currentChat?.pdfUrl || ""} />
                    </div>
                    {/* chat component  */}
                    <div className='flex-[3] border-l-4 border-l-slate-200' >
                        <ChatComponent chatId={chatId} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default ChatPage; 