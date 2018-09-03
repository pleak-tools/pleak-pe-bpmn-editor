import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class FunSSReconstruction extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("FunSSReconstruction", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.FunSSReconstruction != null) {
      return JSON.parse(this.task.FunSSReconstruction);
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

    this.settingsPanelContainer.find('#FunSSReconstruction-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#FunSSReconstruction-outputObjects').html(outputObjects);
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
      this.task.FunSSReconstruction = JSON.stringify(this.getCurrentStereotypeSettings());
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#FunSSReconstruction-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#FunSSReconstruction-conditions-help').show();
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
    // Inputs: private
    // Outputs: public
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("private-i");
    }
    if (outputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("public-o");
    }
    if (statuses.length > 0) {
      return statuses;
    }
    return null;
  }

  /** Validation functions */
  areInputsAndOutputsNumbersCorrect() {
    // Must have:
    // Inputs: exactly 2
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 2 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areInputsFromTaskWithStereotypeAccepted(taskId: String) {
    // Accepted:
    // FunSSSharing
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.FunSSSharing) {
          return true;
        }
      }
    }
    return false;
  }

  areShareOfFunctionSharesFromSameOrigin() {
    let flag = false;
    for (let incTask of this.getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, this.getTaskInputObjects()) && this.areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let outputElementsNames = this.getTaskOutputObjectsBasedOnTaskStereotype(incTask).map(a => a.businessObject.name.trim());
        let matchingNames = [];
        if (outputElementsNames) {
          for (let outputElementName of outputElementsNames) {
            for (let inputObject of this.getTaskInputObjects()) {
              if (inputObject.businessObject.name.trim() == outputElementName) {
                matchingNames.push(outputElementName.trim());
              }
            }
          }
          outputElementsNames.sort();
          matchingNames.sort();
          if (outputElementsNames.toString() === matchingNames.toString()) {
            flag = true;
          }
        }
      }
    }
    if (!flag) {
      return false
    }
    return true;
  }

  areShareOfFunctionSharesDifferent() {
    if (this.getTaskInputObjects()[0].businessObject.name.trim() == this.getTaskInputObjects()[1].businessObject.name.trim()) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "FunSSReconstruction error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    } else {
      if (!this.areShareOfFunctionSharesFromSameOrigin()) {
        this.addUniqueErrorToErrorsList(existingErrors, "FunSSReconstruction error: both input function shares must originate from the same task with FunSSSharing stereotype", [this.task.id], []);
      } else {
        if (!this.areShareOfFunctionSharesDifferent()) {
          this.addUniqueErrorToErrorsList(existingErrors, "FunSSReconstruction error: input function shares must be different", [this.task.id], []);
        }
      }
    }
  }

}