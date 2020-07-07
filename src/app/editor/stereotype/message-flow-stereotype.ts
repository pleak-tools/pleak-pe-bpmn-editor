import { MessageFlowHandler } from "../handler/message-flow-handler";
import { Stereotype } from "./stereotype";

export class MessageFlowStereotype extends Stereotype {

  constructor(title: string, messageFlowHandler: MessageFlowHandler) {
    super(title, messageFlowHandler);

    this.messageFlow = messageFlowHandler.messageFlow;
    this.messageFlowHandler = messageFlowHandler;
  }

  messageFlow: any;
  messageFlowHandler: MessageFlowHandler;

  /** Wrappers to access messageFlowHandler functions*/
  getMessageFlowHandlerByMessageFlowId(messageFlowId: string): any {
    return this.messageFlowHandler.getMessageFlowHandlerByMessageFlowId(messageFlowId);
  }

  getMessageFlowInputObjects(): any[] {
    return this.messageFlowHandler.getMessageFlowInputObjects();
  }

  getMessageFlowOutputObjects(): any[] {
    return this.messageFlowHandler.getMessageFlowOutputObjects();
  }

}