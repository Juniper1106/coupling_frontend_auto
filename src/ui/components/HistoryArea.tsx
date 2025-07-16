import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Space, Segmented } from 'antd';
import { MessageOutlined, HistoryOutlined } from '@ant-design/icons';
import '@ui/components/HistoryArea.scss'
import HistoryActions from "./HistoryActions";
import ChatHistory from "./ChatHistory"
import { socket } from './socket';
import notifyAudioNewMessage from '@ui/assets/audio/new_message.mp3'
import notifyAudioEditCanvas from '@ui/assets/audio/edit_canvas.mp3'
import { NetworkMessages } from '@common/network/messages';
import { useCouplingStyle } from '@ui/contexts/CouplingStyle';
import { useProactiveInterval } from '@ui/contexts/ProactiveInterval';

const { TextArea } = Input;

interface ChatMessage {
    id: number
    text: string
    img_url: string
    sender: 'sent' | 'received' | 'loading' | 'server'
}

interface AI_action {
    id: number
    msg_id: number | null
    node_id: string
    title: string
    action: string
    description: string
}

interface HistoryAreaProps {
    actions: AI_action[]
    setNextAction: (action: string) => void
}

const App: React.FC<HistoryAreaProps> = ({actions, setNextAction}) => {
    const couplingStyle = useCouplingStyle();               // 读取全局 CouplingStyle 值
    const couplingStyleRef = useRef(couplingStyle);         // 用 useRef 保存 couplingStyle 的引用
    const proactiveInterval = useProactiveInterval();
    const proactiveIntervalRef = useRef(proactiveInterval);

    const [value, setValue] = useState('Chat');
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
    const messagesRef = useRef<ChatMessage[]>(messages);
    const [selectedMessageId, setSelectedMessageId] = useState<number|null>(null);
    const actionsRef = useRef<AI_action[]>(actions);

    // useEffect(() => {
    //     const intervalId = setInterval(async () => {
    //         // console.log(`已等待 ${(Date.now() - lastUpdateTime)/1000} 秒无打字操作`);
    //         // console.log(`proactiveInterval: ${proactiveIntervalRef.current}`);
    //         if (Date.now() - lastUpdateTime >= proactiveIntervalRef.current * 1000) {
    //             console.log(`已等待${proactiveIntervalRef.current}秒，发送inactive_update请求`);
    //             const response = await fetch('http://127.0.0.1:5010/inactive_update')
    //             const res = await response.json()
    //             console.log(res)
    //             setLastUpdateTime(Date.now());
    //         }
    //     }, 1000); // 每秒检查一次
    
    //     // 清除定时器
    //     return () => clearInterval(intervalId);
    // }, [lastUpdateTime]);
    
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        console.log(actions)
        actionsRef.current = actions;
    }, [actions]);

    const restoreData = async () => {
        const msg_response = await fetch('http://127.0.0.1:5010/getMessages')
        const savedMsg = await msg_response.json()
        setMessages(savedMsg)
    }

    useEffect(() => {
        // 组件挂载时恢复数据
        restoreData()
    }, [])

    const handleAIMessage = (data: any) => {
        const reply: ChatMessage = {
            id: data["id"],
            text: data["text"],
            img_url: data["img_url"],
            sender: 'server'
        }
        if (couplingStyleRef.current != 'INDW') {
            const audio = new Audio(notifyAudioNewMessage);
            audio.play();
        } 
        setMessages(prevMessages => [...prevMessages, reply])
        setSelectedMessageId(data["id"])
        const action = actionsRef.current.find(action => action.msg_id === data["id"]);
        if (couplingStyleRef.current === 'SCOL') {
            NetworkMessages.ADD_CONTENT_IN_AI.send({ id: action?.id, server: true, text: data["text"], img_url: data["img_url"] });
        } else if (couplingStyleRef.current === 'INDW') {
            NetworkMessages.ADD_CONTENT_IN_AI.send({ id: action?.id, server: true, text: data["text"], img_url: data["img_url"] });
        }
    }

    const playAudioEditCanvas = async () => {
        const audio = new Audio(notifyAudioEditCanvas);
        await audio.play();
    }

    const handleAIConclude = async (data: any) => {
        NetworkMessages.ADD_CONTENT.send({ id: data["id"], server: true, text: data["text"], img_url: data["img_url"] })
        await playAudioEditCanvas();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 获取最后两条‘received’消息
        console.log("all messages:", messagesRef.current);
        const receivedMessages = messagesRef.current.filter(msg => msg.sender === 'received');
        const lastTwoReceived = receivedMessages.slice(-2);
        
        for (const msg of lastTwoReceived) {
            if (msg.img_url) {
                NetworkMessages.ADD_CONTENT.send({ id: data["id"], server: true, text: "", img_url: msg.img_url });
                await new Promise(resolve => setTimeout(resolve, 1000));
                await playAudioEditCanvas();
            }
        }
    }

    useEffect(() => {
        couplingStyleRef.current = couplingStyle;           // 每次 couplingStyle 更新时，同步到 ref
    }, [couplingStyle]);

    useEffect(() => {
        proactiveIntervalRef.current = proactiveInterval;           // 每次 couplingStyle 更新时，同步到 ref
    }, [proactiveInterval]);

    useEffect(() => {
        // 连接后端并监听消息
        socket.on('AI_message', handleAIMessage);

        socket.on('AI_conclude', handleAIConclude);

        socket.on('reload', async () => {
            restoreData()
        });

        // 清理事件监听器
        return () => {
            socket.off('AI_message');
        };
    }, []);

    const gptChatFunction = async (question: string) => {
        // 创建一个加载中的消息
        const res = await fetch('http://127.0.0.1:5010/getMsgId')
        const id = await res.json()
        const loadingMessage: ChatMessage = {
            id: id["id"],
            text: '', // 内容为空
            img_url: '', // 图片为空
            sender: 'loading', // 设置一个特殊的发送者标识
        }

        // 先把loading状态的消息添加到messages
        setMessages(prevMessages => [...prevMessages, loadingMessage])
        setSelectedMessageId(id["id"])

        // 创建要发送的数据对象
        const sendData = { "id": loadingMessage.id, "prompt": question, "timeStamp": new Date().getTime()}
        const response = await fetch('http://127.0.0.1:5010/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // 设置请求头为 JSON
            },
            body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
        })

        const receivedData = await response.json()
        console.log(receivedData.image)
        const reply: ChatMessage = {
            id: receivedData.id,
            text: receivedData.text,
            img_url: receivedData.image,
            sender: 'received'
        }
        const audio = new Audio(notifyAudioNewMessage);
        audio.play();
        // setMessages(prevMessages => [...prevMessages, reply])
        // 替换掉最后一个loading消息为真实的回复
        setMessages(prevMessages => {
            // 查找最后一个 sender 为 'loading' 的消息的索引
            const lastIndex = (() => {
                for (let i = prevMessages.length - 1; i >= 0; i--) {
                    if (prevMessages[i].sender === 'loading') {
                        return i;
                    }
                }
                return -1; // 如果没有找到，返回 -1
            })();

            if (lastIndex !== -1) {
                const updatedMessages = [...prevMessages];
                updatedMessages[lastIndex] = {
                    ...updatedMessages[lastIndex],
                    sender: 'received',
                    text: reply.text,
                    img_url: reply.img_url
                };
                return updatedMessages;
            }

            // 如果没有找到 'loading' 的消息，直接添加 reply
            return [...prevMessages, reply];
        })
        setSelectedMessageId(receivedData.id)
    }

    const handleSend = async (txt:string) => {
        if (txt !== '') {
            setValue('Chat')
            setNextAction("生成回复")
            const response = await fetch('http://127.0.0.1:5010/getMsgId')
            const new_id = await response.json()
            const newMessage: ChatMessage = {
                id: new_id["id"],
                text: txt,
                img_url: "",
                sender: 'sent'
            }
            setMessages(prevMessages => [...prevMessages, newMessage])
            console.log('将发送消息:', inputText);
            setInputText('');
            setSelectedMessageId(new_id["id"])
            gptChatFunction(newMessage.text)
        }
    }

    const handleTitleClick = (msg_id: number | null, node_id: string) => {
        if(msg_id !== null){
            setSelectedMessageId(msg_id);
            setValue('Chat');
        }
        if(node_id !== ""){
            NetworkMessages.FIND_NODE.send({ nodeId: node_id });
        }
    };

    function switchPage() {
        if (value === 'History') {
            return <HistoryActions actions={actionsRef.current} onTitleClick={handleTitleClick} />;
        } else {
            return <ChatHistory messages={messages} scrollToMessageId={selectedMessageId}/>
        }
    }

    return (
        <div className='historyArea'>
            {switchPage()}
            <div className='inputArea'>
                <Space.Compact className='input'>
                    <Segmented
                        options={[
                            { value: 'Chat', icon: <MessageOutlined /> },
                            { value: 'History', icon: <HistoryOutlined /> },
                        ]}
                        value={value}
                        onChange={(val) => setValue(val)}
                    />
                    <TextArea
                        placeholder="给AI发送消息"
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            setLastUpdateTime(Date.now());
                        }}
                        autoSize={{ maxRows: 4 }}
                    />
                    <Button type="primary" onClick={() => { handleSend(inputText) }}>发送</Button>
                </Space.Compact>
            </div>
        </div>
    );
}

export default App;