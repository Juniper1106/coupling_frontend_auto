import { NetworkSide } from "@common/network/sides";
import * as Networker from "monorepo-networker";

interface Payload {
  id: number | undefined,
  server: boolean,
  text: string,
  img_url: string
}

export class AddContentInAI extends Networker.MessageType<Payload> {
  public receivingSide(): Networker.Side {
    return NetworkSide.PLUGIN;
  }

  public async handle(payload: Payload, from: Networker.Side): Promise<void> {
    if (figma.editorType === "figma") {
      //寻找名称为AI workspace的frmae，如果没有则创建
      let aiWorkspace = figma.currentPage.findOne(node => node.name === 'AI workspace' && node.type === 'FRAME') as FrameNode
      if (!aiWorkspace) {
        aiWorkspace = figma.createFrame()
        aiWorkspace.name = 'AI workspace'
        aiWorkspace.layoutMode = 'VERTICAL'
        aiWorkspace.counterAxisSizingMode = 'AUTO'
        aiWorkspace.primaryAxisSizingMode = 'AUTO'
        aiWorkspace.itemSpacing = 20
        aiWorkspace.x = 0
        aiWorkspace.y = 0
        figma.currentPage.appendChild(aiWorkspace)
      }
      if (payload.img_url === '') {
        //在AI workspace中添加文本框
        const nodes = aiWorkspace.children;
        const text = figma.createText()
        if (payload.server){
          const node_id = text.id
          const sendData = {"action_id": payload.id, "node_id": node_id}
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
        const width = text.width>320?320:text.width
        text.resize(width, text.height)
        aiWorkspace.appendChild(text)
      } else {
        //在AI workspace中添加图片
        const imageUrl = payload.img_url; // 获取传递的图片 URL

        // 获取图片数据并创建图像
        const response = await fetch(imageUrl);
        const imageData = await response.arrayBuffer();
        const image = figma.createImage(new Uint8Array(imageData));
  
        // 创建图片节点并设置图片填充
        const imageNode = figma.createRectangle();
        if (payload.server){
          const node_id = imageNode.id
          const sendData = {"action_id": payload.id, "node_id": node_id}
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
  
        // 插入到画布的中心
        aiWorkspace.appendChild(imageNode)
      }
    }
  }
}
