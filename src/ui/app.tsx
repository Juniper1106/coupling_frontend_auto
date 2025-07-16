import React from 'react';
import { useState, useEffect } from "react";
import { UserOutlined } from '@ant-design/icons';
import { Input, Button } from 'antd';
import "@ui/styles/main.scss";
// import SliderArea from "./components/dustbin/SliderArea";
import CardTabChangeStyle from './components/CardTabChangeStyle';
import HistoryArea from "./components/HistoryArea";
import CurrentAndUpcomingAction from "./components/CurrentAndUpcomingAction"
// import DropDownArea from './components/dustbin/DropDownArea';
import { CouplingStyleProvider } from '@ui/contexts/CouplingStyle';
import { ProactiveIntervalProvider } from './contexts/ProactiveInterval';
import { socket } from './components/socket';
import { Color } from 'antd/es/color-picker';

interface AI_action {
  id: number
  msg_id: number | null
  node_id: string
  title: string
  action: string
  description: string
}

function App() {
  const [login, setLogin] = useState(false);

  const LoginPageForProbe: React.FC = () => {
    const [userName, setUserName] = useState('');
    const [task, setTask] = useState('扫地机器人的手机端APP');

    async function handleLogin(username: string, task: string) {
      // setLogin(true); // UI test only

      // original login logic
      if (login === false) {
        const sendData = { "username": username, "task": task }
        const response = await fetch('http://127.0.0.1:5010/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // 设置请求头为 JSON
          },
          body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
        })

        if (response.ok) {
          const receivedData = await response.json()
          setLogin(true)
          console.log(receivedData.message)
          socket.emit('start_background_task');
        }
        else {
          console.error('Failed to send data');
        }
      }
    }
    return (
      <div className="loginPageForProbe">
        <Input size="large" placeholder="请输入被试编号" prefix={<UserOutlined />} value={userName} onChange={(e) => setUserName(e.target.value)} />
        <br />
        <Input size="large" placeholder="请输入任务内容" value={task} onChange={(e) => setTask(e.target.value)} />
        <br />
        <br />
        <Button type="primary" onClick={() => { handleLogin(userName, task) }}>提交</Button>
        {/* <p>当前未开启登录验证</p> */}
      </div>
    )
  };

  const [actions, setActions] = useState<AI_action[]>([]);
  const [latestAction, setLatestAction] = useState<AI_action | null>(null);
  const [isLatestActionFinish, setIsLatestActionFinish] = useState<boolean>(true);
  const [isLatestActionSuccess, setIsLatestActionSuccess] = useState<boolean>(true);
  const [nextAction, setNextAction] = useState<string>("主动交流");

  const restoreActions = async () => {
    const action_response = await fetch('http://127.0.0.1:5010/getActions')
    const savedAction = await action_response.json()
    setActions(savedAction)
  }

  useEffect(() => {
    restoreActions()
  }, [])

  useEffect(() => {
    // 连接后端并监听消息
    socket.on('AI_action', (data) => {
      setIsLatestActionFinish(false)
      setLatestAction(data);
      setNextAction("主动交流")
    });

    socket.on('update_action', (data) => {
        setActions(prevActions =>
            prevActions.map(action => 
                action.id === data['action_id']
                    ? { ...action, node_id: data['node_id'] } // 替换 node_id 的新对象
                    : action // 其他元素保持不变
            )
        );
    });

    socket.on('AI_action_finish', (data) => {
      console.log(data)
      console.log(latestAction)
      if(data['id'] === latestAction?.id){
        setIsLatestActionFinish(true)
        setIsLatestActionSuccess(data['success'])
      }
      if (latestAction) {
        setActions(prevActions => {
          const updatedActions = [latestAction, ...prevActions];
            return updatedActions;
        });
      }
    });

    socket.on('edit_canvas', () => {
      setNextAction("编辑画布")
    })
  }, [latestAction]);

  function switchPage() {
    if (login === false)
      return <LoginPageForProbe />
    else return (
      <>
        {/* <DropDownArea /> */}
        {/* <SliderArea /> */}
        <CardTabChangeStyle />
        <div className='recentActionsArea'>
          <CurrentAndUpcomingAction currentAction={latestAction} isCurrentActionFinish={isLatestActionFinish} isCurrentActionSuccess={isLatestActionSuccess} nextAction={nextAction}/>
        </div>
        <HistoryArea actions={actions} setNextAction={setNextAction}/>
      </>
    )
  }

  return (
    <CouplingStyleProvider>
      <ProactiveIntervalProvider>
        <div className="homepage">
          {switchPage()}
        </div>
      </ProactiveIntervalProvider>
    </CouplingStyleProvider>
  );
}

export default App;
