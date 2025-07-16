import { NetworkSide } from "@common/network/sides";
import * as Networker from "monorepo-networker";

interface Payload {
  nodeId: string;
}

export class FindNode extends Networker.MessageType<Payload> {
  public receivingSide(): Networker.Side {
    return NetworkSide.PLUGIN;
  }

  public async handle(payload: Payload, from: Networker.Side): Promise<void> {
    if (figma.editorType === "figma") {
        console.log(payload.nodeId);
        
        try {
            // 使用 getNodeByIdAsync 代替 getNodeById
            // @ts-ignore
            const node = await figma.getNodeByIdAsync(payload.nodeId);
            
            if (node && node.type !== 'PAGE') {
                // 将当前页面的选中节点设置为该节点
                figma.currentPage.selection = [node as SceneNode];
                
                // 滚动并缩放到该节点，使其可见
                figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
            } else {
                figma.notify('未找到对应内容！');
                console.error("Node not found or invalid node type");
            }
        } catch (error) {
            console.error("Error fetching node:", error);
        }
    }
  }
}
