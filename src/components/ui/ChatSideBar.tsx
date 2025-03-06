import { Link, PlusCircle } from 'lucide-react'
import React from 'react'
import {  } from '@/lib/db/schema'
import { Button } from './button'


type Props = {

    chats: DrizzleChat[];
    chatId: number;
}


const ChatSideBar = (props: Props) => {
    return (
        <div className='w-full h-screen p-4 text-gray-900'>
            <Link href='/' >
                <Button>
                    <PlusCircle className='mr-2 w-4 h-4' />
                    New Chat
                </Button>
            </Link>
            ChatSideBar
        </div>
    )
}

export default ChatSideBar