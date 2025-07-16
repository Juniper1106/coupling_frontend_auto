import React, { useState, useEffect } from 'react';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space, Typography, Button, Tooltip } from 'antd';
import { TeamOutlined, ReloadOutlined, CloseOutlined } from "@ant-design/icons";
import { useCouplingStyle, useCouplingStyleUpdate } from '@ui/contexts/CouplingStyle';
import "@ui/components/DropDownArea.scss";
import { socket } from '../socket';
import notifyAudioStyleChangeTimeout from '@ui/assets/audio/style_change_timeout.mp3';
import { NetworkMessages } from '@common/network/messages';
import { useProactiveIntervalUpdate } from '@ui/contexts/ProactiveInterval';

const items: MenuProps['items'] = [
  {
    key: 'DISC',
    label: '讨论模式',
  },
  // {
  //   key: 'OSTB',
  //   label: '待机模式',
  // },
  {
    key: 'SCOL',
    label: '轻量协作模式',
  },
  {
    key: 'INDW',
    label: '独立工作模式',
  }
];

const DropDownArea: React.FC = () => {
  const couplingStyle = useCouplingStyle();               // 读取全局 CouplingStyle 值
  const setCouplingStyle = useCouplingStyleUpdate();      // 获取更新 CouplingStyle 的方法
  const setProactiveInterval = useProactiveIntervalUpdate();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  useEffect(() => {
      const intervalId = setInterval(async () => {
          if (Date.now() - lastUpdateTime >= 90000) {
              console.log('已等待90秒，发送inactive_update请求');
              const audio = new Audio(notifyAudioStyleChangeTimeout);
              audio.play();
              NetworkMessages.NOTIFY_STYLE_CHANGE.send({ message: "状态调整提醒，调整后请大声思考", timeout: 3000});

              setLastUpdateTime(Date.now());
            }
          }, 1000); // 每秒检查一次

          // 清除定时器
      return () => clearInterval(intervalId);
  }, [lastUpdateTime]);
    
  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    setCouplingStyle(e.key);  // 使用全局更新方法更新 CouplingStyle
    setLastUpdateTime(Date.now());
    await fetch(
      'http://127.0.0.1:5010/style_change',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({style: e.key})
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
  };

  const stopbackend = () => {
    socket.emit('stop_background_task');
  }

  const refresh = () => {
    socket.emit('refresh');
  }

  return (
    <div className="dropDownContainer">
      <div className='label'>
        <TeamOutlined />
        <Typography>协作模式</Typography>
      </div>
      <Dropdown
        menu={{
          items,
          selectable: true,
          defaultSelectedKeys: [couplingStyle],
          onClick: handleMenuClick,
        }}
      >
        <Typography.Link>
          <Space>
            {couplingStyle}
            <DownOutlined />
          </Space>
        </Typography.Link>
      </Dropdown>
      <Tooltip title="刷新">
        <Button type="primary" shape="circle" icon={<ReloadOutlined />} size='small' onClick={refresh}/>
      </Tooltip>
      <Tooltip title="终止主动回复">
        <Button type="primary" shape="circle" icon={<CloseOutlined /> } size='small' onClick={stopbackend}/>
      </Tooltip>
    </div>
  );
};

export default DropDownArea;