import { List, Typography } from 'antd';
import "@ui/components/HistoryActions.scss"
import CurrentAndUpcomingAction from "./CurrentAndUpcomingAction"
import React from 'react';

interface AI_action {
  id: number
  msg_id: number | null
  node_id: string
  title: string
  action: string
  description: string
}

interface ActionProps {
  actions: AI_action[]
  onTitleClick: (msg_id: number|null, node_id: string) => void
}

const { Title } = Typography;
const HistoryActions: React.FC<ActionProps> = ( {actions, onTitleClick} ) => {
    return (
        <div className='historyActions'>
          <Title level={5}>AI行为历史</Title>
          <List
            itemLayout="horizontal"
            dataSource={actions}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  title={<a onClick={() => onTitleClick(item.msg_id, item.node_id)}>{item.title}</a>}
                  description={
                    <span
                        dangerouslySetInnerHTML={{
                            __html: `要点：${item.action}<br />解释：${item.description}`,
                        }}
                    />
                  }
                />
              </List.Item>
            )}
          />
        </div>
    )
}

export default HistoryActions;