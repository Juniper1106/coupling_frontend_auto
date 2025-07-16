import React from 'react'
import styles from './Message.module.scss'
import {Image, Spin} from "antd"

interface MessageProps {
    text: string
    img_url: string
    sender: 'sent' | 'received' | 'loading' | 'server'
}

const Message: React.FC<MessageProps> = ({ text, img_url, sender }) => {
    return (
        <div className={styles[`message-${sender}`]}>
            {sender === 'loading' ? (
                <Spin />
            ) : (
                <>
                    {(text !== '') && (
                        <div
                            className={styles[`text`]}
                            dangerouslySetInnerHTML={{ __html: text.replace(/(\n|\r|\r\n)/g, '<br />') }}
                        />
                    )}
                    {(img_url !== '') && <Image width={80} src={img_url} />}
                </>
            )}
        </div>
    )
}

export default Message