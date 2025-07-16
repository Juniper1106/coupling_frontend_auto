import { initializeNetwork } from "@common/network/init";
import { NetworkMessages } from "@common/network/messages";
import { NetworkSide } from "@common/network/sides";
import React from "react";
import ReactDOM from "react-dom/client";
import { socket } from './components/socket';

async function bootstrap() {
  initializeNetwork(NetworkSide.UI);

  NetworkMessages.HELLO_PLUGIN.send({ text: "Hey there, Figma!" });

  const App = (await import("./app")).default;

  const rootElement = document.getElementById("root") as HTMLElement;
  const root = ReactDOM.createRoot(rootElement);

  //socket连接
	// const socket = io('http://127.0.0.1:5010'); // 确保安装了 socket.io-client
	console.log('Socket established', socket);
	//显示连接失败，查看失败原因
	socket.on('connect_error', (error) => {
		console.log("Failed to connect to WebSocket server:", error);
	});

	socket.on('connect', () => {
		console.log("Connected to WebSocket server");
	});
  
	socket.on('message', (data) => {
		console.log("Message from backend:", data);
		// 处理接收到的消息
	});

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
