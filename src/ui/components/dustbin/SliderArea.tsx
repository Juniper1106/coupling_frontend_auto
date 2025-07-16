import "@ui/components/SliderArea.scss"
import { SliderSingleProps } from "antd";
import { Slider, Typography, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useProactiveInterval, useProactiveIntervalUpdate } from "@ui/contexts/ProactiveInterval";
import { useCouplingStyle } from "@ui/contexts/CouplingStyle";
import type { InputNumberProps } from 'antd';
import React, { useCallback, useState } from 'react';
import { debounce } from 'lodash';

const { Text } = Typography;

const SliderArea: React.FC = () => {
    const contextRange: SliderSingleProps['marks'] = {
        0.75: '小',
        // 2: ' ',
        3: '大',
    }

    const [context, setContext] = useState(1);
    const couplingStyle = useCouplingStyle();
    const proactiveInterval = useProactiveInterval();
    const setProactiveInterval = useProactiveIntervalUpdate();

    const onFrequencyChange: InputNumberProps['onChange'] = (newValue) => {
        setProactiveInterval(newValue as number);
        debouncedFrequencyFetch(newValue as number);
    };

    const onContextChange: InputNumberProps['onChange'] = (newValue) => {
        setContext(newValue as number);
        debouncedContextFetch(newValue as number);
    };

    const fetchIntervalChange = async (newValue: number) => {
        await fetch(
            'http://127.0.0.1:5010/interval_change',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ interval: newValue })
            }
        ).then(
            response => response.json()
        ).then(
            res => {
                console.log("from backend:", res.message)
            }
        ).catch(
            error => console.error(error)
        )
    };

    const fetchContextChange = async (newValue: number) => {
        await fetch(
            'http://127.0.0.1:5010/context_change',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ context: newValue })
            }
        ).then(
            response => response.json()
        ).then(
            res => {
                console.log("from backend:", res.message)
            }
        ).catch(
            error => console.error(error)
        )
    };
    const debouncedFrequencyFetch = useCallback(debounce(fetchIntervalChange, 300), []);
    const debouncedContextFetch = useCallback(debounce(fetchContextChange, 300), []);

    let fregencyMax, frequencyMin;
    if (couplingStyle === 'DISC' || couplingStyle === 'OSTB') {
        fregencyMax = 30;
        frequencyMin = 10;
    } else if (couplingStyle === 'SCOL') {
        fregencyMax = 45;
        frequencyMin = 15;
    } else {
        fregencyMax = 60;
        frequencyMin = 30;
    }
    const frequencyMid = (fregencyMax + frequencyMin) / 2;
    const frequencyRange: SliderSingleProps['marks'] = {
        [frequencyMin]: '高',
        [frequencyMid]: '中',
        [fregencyMax]: '低',
    }
    return (
        <div className="sliderContainer">
            <div className="sliderGroup">
                <Text>
                    上下文范围&emsp;
                    <Tooltip title="决定AI在生成内容时考虑的历史记录，范围越大，包含的历史记录越久远" placement="top">
                        <InfoCircleOutlined style={{ color: '#444444', marginLeft: '0.25em' }} />
                    </Tooltip>
                </Text>
                <Slider
                    value={context}
                    max={3}
                    min={0.75}
                    step={0.25}
                    onChange={onContextChange}
                    marks={contextRange}
                />
            </div>
            <div className="sliderGroup">
                <Text>
                    主动对话频率
                    <Tooltip title="决定AI发起主动交流的频率，频率越高，主动交流越频繁" placement="top">
                        <InfoCircleOutlined style={{ color: '#444444', marginLeft: '0.25em' }} />
                    </Tooltip>
                </Text>
                <Slider
                    value={proactiveInterval}
                    max={fregencyMax}
                    min={frequencyMin}
                    onChange={onFrequencyChange}
                    marks={frequencyRange}
                />
            </div>
        </div>
    );
}

export default SliderArea;