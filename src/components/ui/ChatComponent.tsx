"use client"
import React from 'react'
import { Input } from './Input'
import { useChat } from 'ai/react'
import { Button } from './button'
import { Send } from 'lucide-react'
import { MessageList } from './MessageList'

type Props = {
    chatId: number
}

const ChatComponent = ({ chatId }: Props) => {
    const { messages, input, handleInputChange, handleSubmit } = useChat({
        api: '/api/chat',
        body: {
            chatId
        }
    });

    React.useEffect(() => {
        const messagesContainer = document.getElementById("message-container");
        if (messagesContainer) {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: "smooth"
            }
            )
        }

    }, [messages])

    return (
        <div className='relative max-h-screen overflow-scroll' id='message-container'>
            <div className='sticky top-0 inset-x-0 p-2 bg-white h-fit'>
                <h3 className='text-xl font-bold'>Chat </h3>
            </div>

            <MessageList messages={messages} />

            <form onSubmit={handleSubmit} className='sticky bottom-0 inset-x-0 p-2 p-y-4 bg-white'>
                <div className='flex'>
                    <Input value={input} onChange={handleInputChange} placeholder='Ask any question' className='w-full' />
                    <Button className='bg-blue-400 ml-2'>
                        <Send className='h-4 w-4' />
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default ChatComponent 