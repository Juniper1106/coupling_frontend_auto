import * as Networker from "monorepo-networker";
import { NetworkSide } from "@common/network/sides";

interface Payload {
    message: string,
    timeout: number
}

export class NotifyStyleChange extends Networker.MessageType<Payload> {
  receivingSide(): Networker.Side {
    return NetworkSide.PLUGIN;
  }

  public async handle(payload: Payload, from: Networker.Side): Promise<void> {
    console.log("notify succeeded");
    if (figma.editorType === "figma") {
        figma.notify(payload.message, {timeout: payload.timeout});
    }
  }
}