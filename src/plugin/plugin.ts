import * as Networker from "monorepo-networker";
import { initializeNetwork } from "@common/network/init";
import { NetworkSide } from "@common/network/sides";
import { NetworkMessages } from "@common/network/messages";

let lastSelection: readonly SceneNode[] = [];
let messages: Set<string> = new Set();
let propChanges: Map<string, Set<string>> = new Map();
let lastChangeTime = Date.now();

// function startDocumentChangeTimer() {
// 	setInterval(async () => {
// 		// console.log(`已等待 ${(Date.now() - lastChangeTime)/1000} 秒无用户操作`);
// 		const interval = await fetch('http://127.0.0.1:5010/get_OSTB_interval')
// 		const int = await interval.json()
// 		// console.log("Now interval is", int.interval)
// 		if (Date.now() - lastChangeTime >= int.interval * 1000) {
// 			console.log(`已等待${int.interval}秒，发送inactive_change请求`);
// 			const response = await fetch('http://127.0.0.1:5010/inactive_change')
// 			const res = await response.json()
// 			console.log(res)
// 			lastChangeTime = Date.now();
// 		}
// 	}, 1000); // 每秒输出一次消息
// 	console.log('已设置定时器');
// }

async function getCanvasScreenshot() {
	const image = await figma.currentPage.exportAsync({
		format: 'JPG', // 可选择 PNG 或 JPG
		constraint: {
			type: 'HEIGHT', // 可选择 HEIGHT, WIDTH 或 SCALE
			value: 1024 // 缩放比例
		}
	});
	const base64Image = figma.base64Encode(image);
	return base64Image;
}

async function getSelectionScreenshot() {
	if (lastSelection.length === 0) {
		console.log('no selection to capture');
		return null;
	}
	// 如果lastSelection的节点已经被删除,则直接返回
	if (lastSelection[0].removed) {
		console.log('selection has been removed');
		return null;
	}
	const image = await lastSelection[0].exportAsync({
		format: 'JPG', // 可选择 PNG 或 JPG
		constraint: {
			type: 'HEIGHT',
			value: 1024 // 缩放比例
		}
	});
	const base64Image = figma.base64Encode(image);
	return base64Image;
}

async function bootstrap() {
	initializeNetwork(NetworkSide.PLUGIN);

	if (figma.editorType === "figma") {
		figma.showUI(__html__, {
			width: 320,
			height: 680,
			title: "AI Collaborator",
		});
	} else if (figma.editorType === "figjam") {
		figma.showUI(__html__, {
			width: 800,
			height: 650,
			title: "AI Collaborator",
		});
	}

	console.log("Bootstrapped @", Networker.Side.current.getName());

	NetworkMessages.HELLO_UI.send({ text: "Hey there, UI!" });

	//载入字体
	await figma.loadFontAsync({ family: "Inter", style: "Regular" });
	
	//page切换
	figma.on('currentpagechange', async () => {
		const message = `用户切换至页面: ${figma.currentPage.name}`
		console.log(message);
		messages.add(message);
		lastSelection = [];
	});

	//选择改变
	figma.on('selectionchange', async () => {
		console.log('currentSelection', figma.currentPage.selection);
		console.log('lastSelection', lastSelection);
		//如果lastSelection和当前selection的id一样,则直接返回
		if (lastSelection.length === figma.currentPage.selection.length && lastSelection.every((node, index) => node.id === figma.currentPage.selection[index].id)) {
			lastSelection = figma.currentPage.selection;
			return;
		}
		if (messages.size === 0 && propChanges.size === 0) {
			lastSelection = figma.currentPage.selection;
			return;
		}

		let canvasScreenshot = await getCanvasScreenshot();
		let selectionScreenshot = await getSelectionScreenshot();
		if (selectionScreenshot === null) {
			selectionScreenshot = canvasScreenshot;
		}
		if (propChanges.size > 0) {
			for (const [message, props] of propChanges) {
				messages.add(message+Array.from(props).join(', '));
			}
		}
		const msg = Array.from(messages).join('; ');
		console.log('msg:', msg);
		const payload = {
			message: msg,
			canvasScreenshot: canvasScreenshot,
			selectionScreenshot: selectionScreenshot,
			timeStamp: new Date().getTime()
		};
		await fetch(
		  'http://127.0.0.1:5010/save_operation',
		  {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		  }
		).then(
		  response => response.text()
		).then(
		  text => console.log(text)
		).catch(
		  error => console.error(error)
		)

		lastSelection = figma.currentPage.selection;
		messages.clear();
		propChanges.clear();
	});

	//文档改变
	figma.loadAllPagesAsync().then(() => {
		console.log('figma.currentPage', figma.currentPage);
		figma.on("documentchange", async (event) => {
			let message = "";
			lastChangeTime = Date.now();
			for (const change of event.documentChanges) {
				switch (change.type) {
					case "CREATE":
						message = `用户创建${change.node.type}节点${change.node.id}`
						// message = `user create ${change.node.type} node ${change.node.id}`
						console.log(message);
						messages.add(message);
						break;

					case "DELETE":
						message = `用户删除${change.node.type}节点${change.node.id}`
						// message = `user delete ${change.node.type} node ${change.node.id}`
						console.log(message);
						messages.add(message);
						break;

					case "PROPERTY_CHANGE":
						message = `用户改变${change.node.type}节点${change.node.id}的属性: `
						// message = `user change ${change.node.type} node ${change.node.id} properties: `
						if (propChanges.has(message)) {
							change.properties.forEach(prop => propChanges.get(message)?.add(prop));
						} else {
							propChanges.set(message, new Set(change.properties));
						}
						console.log(message);
						break;
				}
			}
		});
	});

	// startDocumentChangeTimer();
}

bootstrap();
