import { MessageFlowStereotype } from "../message-flow-stereotype";
import { MessageFlowHandler } from "../../handler/message-flow-handler";

declare function require(name:string);
declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SecureChannel extends MessageFlowStereotype {

  constructor(messageFlowHandler: MessageFlowHandler) {
    super("SecureChannel", messageFlowHandler);
  }

  /** Functions inherited from MessageFlowStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.settingsPanelContainer.show();

  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
  }

  saveStereotypeSettings() {
    if (this.messageFlow.SecureChannel == null) {
      this.addStereotypeToElement();
    }
    this.messageFlow.SecureChannel = JSON.stringify({});
    super.saveStereotypeSettings();
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}