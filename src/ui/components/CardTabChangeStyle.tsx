import "@ui/components/CardTabChangeStyle.scss"
import React, { useState, useEffect } from 'react';
import { Button, FloatButton, Tabs, TabsProps, Tooltip } from 'antd';
import { useCouplingStyle, useCouplingStyleUpdate } from '@ui/contexts/CouplingStyle';
import { socket } from './socket';
import notifyAudioStyleChangeTimeout from '@ui/assets/audio/style_change_timeout.mp3';
import { NetworkMessages } from '@common/network/messages';
import { useProactiveIntervalUpdate } from '@ui/contexts/ProactiveInterval';
import { ReloadOutlined, CloseOutlined } from "@ant-design/icons";

const items: TabsProps['items'] = [
    {
        key: 'DISC',
        label: '快速讨论',
        children: <>
                    <p className="cardTabChildren"><strong>关注点：</strong>AI与您聚焦于<strong className="AI_behavior_emphasis">相同的细节</strong></p>
                    <p className="cardTabChildren"><strong>交流频率：</strong>AI优先回复您的信息。若您在<strong className="AI_behavior_emphasis">30秒内未发送</strong>信息，AI将主动发起对话</p>
                    <p className="cardTabChildren"><strong>工作区操作：</strong>AI<strong className="AI_behavior_emphasis">每隔两轮对话</strong>将主动总结讨论内容，结果添加至<strong className="AI_behavior_emphasis">画布中心</strong></p>
                  </>,
    },
    {
        key: 'SCOL',
        label: '轻量协作',
        children: <>
                    <p className="cardTabChildren"><strong>关注点：</strong>AI与您聚焦于<strong className="AI_behavior_emphasis">相同的话题</strong></p>
                    <p className="cardTabChildren"><strong>交流频率：</strong>AI优先回复您的信息，且<strong className="AI_behavior_emphasis">每隔45秒</strong>主动发送信息</p>
                    <p className="cardTabChildren"><strong>工作区操作：</strong>AI的<strong className="AI_behavior_emphasis">所有</strong>生成结果添加至<strong className="AI_behavior_emphasis">画布中心</strong></p>
                  </>,
    },
    {
        key: 'INDW',
        label: '独立工作',
        children: <>
                    <p className="cardTabChildren"><strong>关注点：</strong>AI与您<strong className="AI_behavior_emphasis">各自推进</strong>当前任务</p>
                    <p className="cardTabChildren"><strong>交流频率：</strong>AI优先回复您的信息，且<strong className="AI_behavior_emphasis">每隔60秒</strong>主动发送信息</p>
                    <p className="cardTabChildren"><strong>工作区操作：</strong>AI的<strong className="AI_behavior_emphasis">所有</strong>生成结果添加至<strong className="AI_behavior_emphasis">AI工作区</strong></p>
                  </>,
    }
];

const CardTabChangeStyle: React.FC = () => {
  const couplingStyle = useCouplingStyle();               // 读取全局 CouplingStyle 值
  const setCouplingStyle = useCouplingStyleUpdate();      // 获取更新 CouplingStyle 的方法
  const setProactiveInterval = useProactiveIntervalUpdate();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // 以notification加音效提醒状态切换
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (Date.now() - lastUpdateTime >= 180000) {
        console.log('已等待3分钟，发送inactive_update请求');
        const audio = new Audio(notifyAudioStyleChangeTimeout);
        audio.play();
        NetworkMessages.NOTIFY_STYLE_CHANGE.send({ message: "状态调整提醒，调整后请大声思考", timeout: 3000});

        setLastUpdateTime(Date.now());
      }
    }, 1000); // 每秒检查一次

    // 清除定时器
    return () => clearInterval(intervalId);
  }, [lastUpdateTime]);

  const handleTabChange = async (key: string) => {
    console.log(key);
    setCouplingStyle(key);  // 使用全局更新方法更新 CouplingStyle
    setLastUpdateTime(Date.now());
    await fetch(
      'http://127.0.0.1:5010/style_change',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({style: key})
      }
    ).then(
      response => response.json()
    ).then(
      res => {
        console.log(res.message)
        console.log(res.proactive_interval)
        setProactiveInterval(res.proactive_interval)
      }
    ).catch(
      error => console.error(error)
    )
  }

  const stopbackend = () => {
    socket.emit('stop_background_task');
  }

  return (
    <div className='cardTabContainer'>
      <Tabs
        defaultActiveKey={couplingStyle}
        type="card"
        items={items}
        onChange={handleTabChange}
      />
      {/* <FloatButton icon={<CloseOutlined /> } onClick={stopbackend}/> */}
    </div>
  );
};

export default CardTabChangeStyle;