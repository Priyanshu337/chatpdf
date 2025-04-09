import React from 'react'
import { Message } from "ai/react"
import { cn } from '@/lib/utils'

type Props = {
    messages: Message[]
}

export const MessageList = ({ messages }: Props) => {
    if (!messages) return <></>

    return (
        <div className='flex flex-col gap-2 px-4'>
            {messages.map((message) => (
                <div key={message.id} className={cn("flex", {
                    'justify-end pl-10': message.role === 'user',
                    'justify-start pr-10': message.role === 'assistant'
                })}>
                    <div className={cn('rounded-lg px-3 text-sm py-1 shadow-md ring-1 ring-gray-900/10', {
                        'bg-blue-600 text-white': message.role === 'user',
                    })}>
                        <div className='rounded-lg px-4 py-2 max-w-[80%]'>
                            {message.content}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

// export default MessageList

