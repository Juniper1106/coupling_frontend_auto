import { CreateRectMessage } from "@common/network/messages/CreateRectMessage";
import { HelloMessage } from "@common/network/messages/HelloMessage";
import { PingMessage } from "@common/network/messages/PingMessage";
import { AddContentInAI } from "@common/network/messages/AddContentInAI";
import { AddContent } from "@common/network/messages/AddContent";
import { NetworkSide } from "@common/network/sides";
import { FindNode } from "./messages/FindNode";
import { NotifyStyleChange } from "./messages/notifyStyleChange";
import * as Networker from "monorepo-networker";

export namespace NetworkMessages {
  export const registry = new Networker.MessageTypeRegistry();

  export const PING = registry.register(new PingMessage("ping"));

  export const HELLO_PLUGIN = registry.register(
    new HelloMessage(NetworkSide.PLUGIN)
  );

  export const HELLO_UI = registry.register(new HelloMessage(NetworkSide.UI));

  export const CREATE_RECT = registry.register(
    new CreateRectMessage("create-rect")
  );

  export const FIND_NODE = registry.register(
    new FindNode("find-node")
  );

  export const ADD_CONTENT_IN_AI = registry.register(
    new AddContentInAI("add-content-in-ai")
  );

  export const ADD_CONTENT = registry.register(
    new AddContent("add-content")
  );

  export const NOTIFY_STYLE_CHANGE = registry.register(
    new NotifyStyleChange("notify-style-change")
  );
}
