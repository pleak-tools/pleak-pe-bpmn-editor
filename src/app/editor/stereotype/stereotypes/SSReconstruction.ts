import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

export class SSReconstruction extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SSReconstruction", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.SSReconstruction != null) {
      return JSON.parse(this.task.SSReconstruction);
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

    this.settingsPanelContainer.find('#SSReconstruction-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SSReconstruction-outputObjects').html(outputObjects);
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
      this.task.SSReconstruction = JSON.stringify(this.getCurrentStereotypeSettings());
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#SSReconstruction-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SSReconstruction-conditions-help').show();
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

  areInputsFromTaskWithStereotypeAccepted(taskId: string) {
    // Accepted:
    // SSSharing
    // SSComputation
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.SSSharing || task.businessObject.SSComputation) {
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
        let treshold = null;
        let computationParties = null;
        let matchingNames = [];
        if (this.registry.get(incTask).businessObject.SSSharing) {
          treshold = JSON.parse(this.registry.get(incTask).businessObject.SSSharing).treshold;
          computationParties = JSON.parse(this.registry.get(incTask).businessObject.SSSharing).computationParties;
        }
        if (outputElementsNames) {
          for (let outputElementName of outputElementsNames) {
            for (let inputObject of this.getTaskInputObjects()) {
              if (inputObject.businessObject.name.trim() == outputElementName) {
                matchingNames.push(outputElementName);
              }
            }
          }
          if (matchingNames.length !== 0 && matchingNames.length <= outputElementsNames.length) {
            if (this.getTaskInputObjects().map(a => a.businessObject.name.trim()).every(elem => outputElementsNames.indexOf(elem) > -1) && this.getTaskInputObjects().length >= treshold) {
              flag = true;
            }
          }
        }
      }
    }
    if (!flag) {
      return false
    }
    return true;
  }

  areThereEnoughSharesToReconstruct() {
    let flag = false;
    for (let incTask of this.getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, this.getTaskInputObjects()) && this.areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let outputElementsNames = this.elementHandler.elementsHandler.getTaskHandlerByTaskId(incTask).getTaskOutputObjectsBasedOnTaskStereotype().map(a => a.businessObject.name.trim());
        let treshold = null;
        let matchingNames = [];
        if (this.registry.get(incTask).businessObject.SSSharing) {
          treshold = JSON.parse(this.registry.get(incTask).businessObject.SSSharing).treshold;
        }
        if (outputElementsNames) {
          for (let outputElementName of outputElementsNames) {
            for (let inputObject of this.getTaskInputObjects()) {
              if (inputObject.businessObject.name.trim() == outputElementName) {
                matchingNames.push(outputElementName);
              }
            }
          }
          if (matchingNames.length !== 0 && matchingNames.length <= outputElementsNames.length) {
            if (matchingNames.length >= treshold) {
              flag = true;
            }
          }
        }
      }
    }
    if (!flag) {
      return false
    }
    return true;
  }

  getTasksWithProblematicTresholdParameter() {
    let taskIds = [];
    let flag = false;
    for (let incTask of this.getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, this.getTaskInputObjects()) && this.areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let outputElementsNames = this.elementHandler.elementsHandler.getTaskHandlerByTaskId(incTask).getTaskOutputObjectsBasedOnTaskStereotype().map(a => a.businessObject.name.trim());
        let treshold = null;
        let matchingNames = [];
        if (this.registry.get(incTask).businessObject.SSSharing) {
          treshold = JSON.parse(this.registry.get(incTask).businessObject.SSSharing).treshold;
        }
        if (outputElementsNames) {
          for (let outputElementName of outputElementsNames) {
            for (let inputObject of this.getTaskInputObjects()) {
              if (inputObject.businessObject.name.trim() == outputElementName) {
                matchingNames.push(outputElementName);
              }
            }
          }
          if (matchingNames.length !== 0 && matchingNames.length <= outputElementsNames.length) {
            if (matchingNames.length < treshold) {
              taskIds.push(incTask);
            }
          }
        }
      }
    }
    return taskIds;
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
      this.addUniqueErrorToErrorsList(existingErrors, "SSReconstruction error: at least 2 inputs and exactly 1 output are required", [this.task.id], []);
    } else {
      if (!this.areShareOfFunctionSharesFromSameOrigin()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SSReconstruction error: all input function shares must originate from the same task with SSSharing stereotype or from the same group of tasks with SSComputation stereotypes", [this.task.id], []);
      } else {
        if (!this.areShareOfFunctionSharesDifferent()) {
          this.addUniqueErrorToErrorsList(existingErrors, "SSReconstruction error: all input function shares must be different", [this.task.id], []);
        }
      }
      if (!this.areThereEnoughSharesToReconstruct()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SSReconstruction error: the number of input function shares from the task with SSSharing stereotype or from the group of tasks with SSComputation stereotypes must be greater than or equal to the number of treshold", [this.task.id], this.getTasksWithProblematicTresholdParameter());
      }
    }
  }

}