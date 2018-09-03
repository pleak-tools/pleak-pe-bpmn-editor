import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class ProtectConfidentiality extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("ProtectConfidentiality", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.ProtectConfidentiality != null) {
      return JSON.parse(this.task.ProtectConfidentiality);
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
    this.highlightTaskInputAndOutputObjects();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    let inputObjects = "";
    let outputObjects = "";

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#ProtectConfidentiality-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#ProtectConfidentiality-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      if (!this.areInputAndOutputObjectsDifferent()) {
        this.settingsPanelContainer.find('#ProtectConfidentiality-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ProtectConfidentiality-conditions-help2').show();
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.ProtectConfidentiality = JSON.stringify(this.getCurrentStereotypeSettings());
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#ProtectConfidentiality-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#ProtectConfidentiality-conditions-help').show();
      this.initRemoveButton();
    }
  }
  
  removeStereotype() {
    if (confirm('Are you sure you wish to remove the stereotype?')) {
      super.removeStereotype();
    } else {
      this.initRemoveButton();
      return false;
    }
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: public
    // Outputs: private
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("public-i");
    }
    if (outputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("private-o");
    }
    if (statuses.length > 0) {
      return statuses;
    }
    return null;
  }

  /** Validation functions */
  areInputsAndOutputsNumbersCorrect() {
    // Must have:
    // Inputs: exactly 1
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 1 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areInputAndOutputObjectsDifferent() {
    if (this.getTaskInputObjects()[0].id === this.getTaskOutputObjects()[0].id) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ProtectConfidentiality error: exactly 1 input and 1 output are required", [this.task.id], []);
    } else {
      if (!this.areInputAndOutputObjectsDifferent()) {
        this.addUniqueErrorToErrorsList(existingErrors, "ProtectConfidentiality error: input and output objects must be different data objects", [this.task.id], []);
      }
    }
  }

}