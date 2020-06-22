import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

export class FunSSSharing extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("FunSSSharing", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.FunSSSharing != null) {
      return JSON.parse(this.task.FunSSSharing);
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

    this.settingsPanelContainer.find('#FunSSSharing-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#FunSSSharing-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.FunSSSharing = JSON.stringify(this.getCurrentStereotypeSettings());
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#FunSSSharing-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#FunSSSharing-conditions-help').show();
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
  getDataObjectVisibilityStatus(dataObjectId: string) {
    // Inputs: public
    // Outputs: private
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      if (this.task.SGXComputation != null) {
        let savedData = JSON.parse(this.task.SGXComputation);
        if (savedData.inputScript.type == "stereotype") {
          return this.getTaskHandlerByTaskId(this.task.id).getTaskStereotypeInstanceByName("SGXComputation").getDataObjectVisibilityStatus(dataObjectId);
        }
      }
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
    // Outputs: exactly 2
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 1 || numberOfOutputs != 2) {
      return false;
    }
    return true;
  }

  areOutputObjectsDifferent() {
    if (this.getTaskOutputObjects()[0].businessObject.name.trim() === this.getTaskOutputObjects()[1].businessObject.name.trim()) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "FunSSSharing error: exactly 1 input and 2 outputs are required", [this.task.id], []);
    } else {
      if (!this.areOutputObjectsDifferent()) {
        this.addUniqueErrorToErrorsList(existingErrors, "FunSSSharing error: output objects must be different", [this.task.id], []);
      }
    }
  }

}