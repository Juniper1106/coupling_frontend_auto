import { NetworkSide } from "@common/network/sides";
import * as Networker from "monorepo-networker";

interface Payload {
  id: number | undefined,
  server: boolean,
  text: string,
  img_url: string
}

export class AddContent extends Networker.MessageType<Payload> {
  public receivingSide(): Networker.Side {
    return NetworkSide.PLUGIN;
  }

  public async handle(payload: Payload, from: Networker.Side): Promise<void> {
    if (figma.editorType === "figma") {
      const nodes = figma.currentPage.children;
      const gridSize = 20; // 网格大小
      const grid = new Map<string, boolean>(); // 用于存储网格中的占用情况

      // 将已有节点的位置标记到网格中
      for (const node of nodes) {
        if (node.visible && node.absoluteBoundingBox) {
          const { x: nodeX, y: nodeY, width: nodeWidth, height: nodeHeight } = node.absoluteBoundingBox;
          const startX = Math.floor(nodeX / gridSize);
          const endX = Math.floor((nodeX + nodeWidth) / gridSize);
          const startY = Math.floor(nodeY / gridSize);
          const endY = Math.floor((nodeY + nodeHeight) / gridSize);

          for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
              grid.set(`${x},${y}`, true);
            }
          }
        }
      }

      let foundPosition = false;
      let posX = figma.viewport.center.x;
      let posY = figma.viewport.center.y;

      if (payload.text !== '') {
        //在figma中创建文本框
        const text = figma.createText()
        if (payload.server) {
          const node_id = text.id
          const sendData = { "action_id": payload.id, "node_id": node_id }
          const response = await fetch('http://127.0.0.1:5010/addContent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', // 设置请求头为 JSON
            },
            body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
          })

          const receivedData = await response.json()
        }
        text.characters = payload.text
        // 设置文本框最大宽度
        const width = text.width > 320 ? 320 : text.width
        text.resize(width, text.height)
        // 查找空余位置
        for (let y = Math.floor(figma.viewport.center.y / gridSize); y < Math.floor((figma.viewport.bounds.y + figma.viewport.bounds.height) / gridSize) && !foundPosition; y++) {
          for (let x = Math.floor(figma.viewport.center.x / gridSize); x < Math.floor((figma.viewport.bounds.x + figma.viewport.bounds.width) / gridSize) && !foundPosition; x++) {
            let isOccupied = false;
            for (let i = 0; i < Math.ceil(text.width / gridSize); i++) {
              for (let j = 0; j < Math.ceil(text.height / gridSize); j++) {
                if (grid.get(`${x + i},${y + j}`)) {
                  isOccupied = true;
                  break;
                }
              }
              if (isOccupied) break;
            }
            if (!isOccupied) {
              posX = x * gridSize;
              posY = y * gridSize;
              foundPosition = true;
            }
          }
        }

        if (!foundPosition) {
          posX = figma.viewport.center.x;
          posY = figma.viewport.center.y;
        }
        text.x = posX;
        text.y = posY;
        // 在文本框周边绘制一个矩形
        const rect = figma.createRectangle();
        rect.x = text.x - 5;
        rect.y = text.y - 5;
        rect.resize(text.width + 10, text.height + 10);
        rect.strokes = [{ type: 'SOLID', color: { r: 1, g: 0.835, b: 0.569 }, opacity: 1 }];
        rect.strokeWeight = 3;
        rect.fills = [];
        figma.currentPage.appendChild(rect);
        figma.currentPage.appendChild(text);
        // 组合文本框和矩形
        figma.group([rect, text], figma.currentPage);
        // figma.viewport.scrollAndZoomIntoView([text])
        console.log('text added')
      } else {
        // 在figma中添加图片
        const imageUrl = payload.img_url; // 获取传递的图片 URL
        console.log(imageUrl)

        // 获取图片数据并创建图像
        const response = await fetch(imageUrl);
        const imageData = await response.arrayBuffer();
        const image = figma.createImage(new Uint8Array(imageData));

        // 创建图片节点并设置图片填充
        const imageNode = figma.createRectangle();
        if (payload.server) {
          const node_id = imageNode.id
          const sendData = { "action_id": payload.id, "node_id": node_id }
          const response = await fetch('http://127.0.0.1:5010/addContent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', // 设置请求头为 JSON
            },
            body: JSON.stringify(sendData), // 将数据对象转换为 JSON 字符串并发送
          })

          const receivedData = await response.json()
        }
        imageNode.resize(160, 160); // 设置图片大小，可以根据需求调整
        imageNode.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
        imageNode.name = 'image'
        // 设置边框
        imageNode.strokes = [{ type: 'SOLID', color: { r: 1, g: 0.835, b: 0.569 }, opacity: 1 }];
        imageNode.strokeWeight = 3;
        // 查找空余位置
        for (let y = Math.floor(figma.viewport.center.y / gridSize); y < Math.floor((figma.viewport.bounds.y + figma.viewport.bounds.height) / gridSize) && !foundPosition; y++) {
          for (let x = Math.floor(figma.viewport.center.x / gridSize); x < Math.floor((figma.viewport.bounds.x + figma.viewport.bounds.width) / gridSize) && !foundPosition; x++) {
            let isOccupied = false;
            for (let i = 0; i < Math.ceil(imageNode.width / gridSize); i++) {
              for (let j = 0; j < Math.ceil(imageNode.height / gridSize); j++) {
                if (grid.get(`${x + i},${y + j}`)) {
                  isOccupied = true;
                  break;
                }
              }
              if (isOccupied) break;
            }
            if (!isOccupied) {
              posX = x * gridSize;
              posY = y * gridSize;
              foundPosition = true;
            }
          }
        }

        if (!foundPosition) {
          posX = figma.viewport.center.x;
          posY = figma.viewport.center.y;
        }

        imageNode.x = posX;
        imageNode.y = posY;
        figma.currentPage.appendChild(imageNode);
        console.log('image added')
      }
    }
  }
}
