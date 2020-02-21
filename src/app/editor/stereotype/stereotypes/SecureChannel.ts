import { ValidationErrorObject } from "../../handler/validation-handler";
import { MessageFlowStereotype } from "../message-flow-stereotype";
import { MessageFlowHandler } from "../../handler/message-flow-handler";

export class SecureChannel extends MessageFlowStereotype {

  constructor(messageFlowHandler: MessageFlowHandler) {
    super("SecureChannel", messageFlowHandler);
  }

  /** Functions inherited from MessageFlowStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.messageFlow.SecureChannel != null) {
      return JSON.parse(this.messageFlow.SecureChannel);
    } else {
      return null;
    }
  }

  // Returns an empty object
  getCurrentStereotypeSettings() {
    return {};
  }

  initStereotypePublicView() {
    super.initStereotypePublicView();
  }

  initStereotypeSettings() {
    super.initStereotypeSettings();
    this.settingsPanelContainer.show();

    let inputObjects = "";
    let outputObjects = "";

    for (let inputObject of this.getMessageFlowInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getMessageFlowOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SecureChannel-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SecureChannel-outputObjects').html(outputObjects);
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
  }

  saveStereotypeSettings() {
    if (this.getSavedStereotypeSettings() == null) {
      this.addStereotypeToElement();
    }
    this.messageFlow.SecureChannel = JSON.stringify(this.getCurrentStereotypeSettings());
    return true;
  }

  removeStereotype() {
    if (confirm('Are you sure you wish to remove the stereotype?')) {
      super.removeStereotype();
    } else {
      this.initRemoveButton();
      return false;
    }
  }

  /** Validation functions */
  areInputsAndOutputsNumbersCorrect() {
    // Must have:
    // Input-output pairs: at least 1
    let numberOfInputs = this.getMessageFlowInputObjects().length;
    let numberOfOutputs = this.getMessageFlowOutputObjects().length;
    if (numberOfInputs < 1 || numberOfOutputs < 1) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let inputObjectsNames = this.getMessageFlowInputObjects().map(obj => obj.businessObject.name.trim()).sort();
    let outputObjectsNames = this.getMessageFlowOutputObjects().map(obj => obj.businessObject.name.trim()).sort();

    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SecureChannel error: at least 1 incoming-outgoing pair of data objects is required", [this.messageFlow.id], []);
    } else {
      if (inputObjectsNames.length != outputObjectsNames.length) {
        this.addUniqueErrorToErrorsList(existingErrors, "SecureChannel error: number of incoming-outgoing pair of data objects does not match", [this.messageFlow.id], []);
      } else {
        if (inputObjectsNames.toString() !== outputObjectsNames.toString()) {
          this.addUniqueErrorToErrorsList(existingErrors, "SecureChannel error: names of incoming and outgoing data objects must match", [this.messageFlow.id], []);
        }
      }
    }
  }

}