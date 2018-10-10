import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class AddSSReconstruction extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("AddSSReconstruction", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.AddSSReconstruction != null) {
      return JSON.parse(this.task.AddSSReconstruction);
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

    this.settingsPanelContainer.find('#AddSSReconstruction-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#AddSSReconstruction-outputObjects').html(outputObjects);
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
      this.task.AddSSReconstruction = JSON.stringify(this.getCurrentStereotypeSettings());
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#AddSSReconstruction-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#AddSSReconstruction-conditions-help').show();
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
    // Inputs: at least 2
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs < 2 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areInputsFromTaskWithStereotypeAccepted(taskId: String) {
    // Accepted:
    // AddSSharing
    // AddSSComputation
    // FunSSComputation
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.AddSSSharing || task.businessObject.AddSSComputation || task.businessObject.FunSSComputation) {
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
        let outputElementsNames = this.elementHandler.elementsHandler.getTaskHandlerByTaskId(incTask).getTaskOutputObjectsBasedOnTaskStereotype().map(a => a.businessObject.name.trim());
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
    let taskInputObjects = this.getTaskInputObjects();
    if (!this.areNamesUnique(taskInputObjects)) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "AddSSReconstruction error: at least 2 inputs and exactly 1 output are required", [this.task.id], []);
    } else {
      if (!this.areShareOfFunctionSharesFromSameOrigin()) {
        this.addUniqueErrorToErrorsList(existingErrors, "AddSSReconstruction error: all input function shares must originate from the same task with AddSSSharing stereotype or from the same group of tasks with AddSSComputation or FunSSComputation stereotypes", [this.task.id], []);
      } else {
        if (!this.areShareOfFunctionSharesDifferent()) {
          this.addUniqueErrorToErrorsList(existingErrors, "AddSSReconstruction error: all input function shares must be different", [this.task.id], []);
        }
      }
    }
  }

}