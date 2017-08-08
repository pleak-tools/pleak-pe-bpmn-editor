import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { MessageFlowHandler } from "../handler/message-flow-handler";
import { Stereotype } from "./stereotype";

export class MessageFlowStereotype extends Stereotype {

  constructor(title: String, messageFlowHandler: MessageFlowHandler) {
    super(title, messageFlowHandler);

    this.messageFlow = messageFlowHandler.messageFlow;
    this.messageFlowHandler = messageFlowHandler;
  }

  messageFlow: any;
  messageFlowHandler: MessageFlowHandler;


  /** Wrappers to access messageFlowHandler functions*/
  getMessageFlowHandlerByMessageFlowId(messageFlowId: String) {
    return this.messageFlowHandler.getMessageFlowHandlerByMessageFlowId(messageFlowId);
  }

}