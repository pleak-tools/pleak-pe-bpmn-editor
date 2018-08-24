import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class OpenConfidentiality extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("OpenConfidentiality", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
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

    this.settingsPanelContainer.find('#OpenConfidentiality-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#OpenConfidentiality-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      if (!this.areInputAndOutputObjectsDifferent()) {
        this.settingsPanelContainer.find('#OpenConfidentiality-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#OpenConfidentiality-conditions-help2').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.OpenConfidentiality == null) {
        this.addStereotypeToElement();
      }
      this.task.OpenConfidentiality = JSON.stringify({});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#OpenConfidentiality-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#OpenConfidentiality-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    if (confirm('Are you sure you wish to remove the stereotype?')) {
      super.removeStereotype();
    } else {
      this.initSaveAndRemoveButtons();
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
    // Inputs: exactly 1
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 1 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areInputsFromTaskWithStereotypeAccepted(taskId: String) {
    // Accepted:
    // ProtectConfidentiality
    // PETComputation
    if (taskId) {
      let task = this.registry.get(taskId).businessObject;
      if (task) {
        if (this.taskHasStereotype(task, "ProtectConfidentiality") || this.taskHasStereotype(task, "PETComputation")) {
          return true;
        }
      }
    }
    return false;
  }

  getTypeOfInput(inputId: String, taskId: String) {
    for (let incTask of this.getTaskHandlerByTaskId(taskId).getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(inputId)]) && this.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName("OpenConfidentiality").areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let incTaskOutputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskOutputObjects().map(a => a.businessObject.name.trim());
        let outputType = null;
        if (this.taskHasStereotype(this.registry.get(incTask).businessObject, "PETComputation")) {
          outputType = JSON.parse(this.registry.get(incTask).businessObject.PETComputation).outputTypes[0].type;
        }
        if (this.taskHasStereotype(this.registry.get(incTask).businessObject, "ProtectConfidentiality")) {
          outputType = "private";
        }
        if (outputType && incTaskOutputElementsNames.indexOf(this.registry.get(inputId).businessObject.name.trim()) !== -1) {
          return outputType;
        }
      }
    }
    return null;
  }

  getTypesFromIncomingPathOfTask(taskId: String) {
    let types = [];
    for (let privateInput of this.getTaskInputObjects()) {
      types.push({inputId: privateInput.id, type: this.getTypeOfInput(privateInput.id, taskId)});
    }
    return types;
  }

  getTypesOfAllTaskInputs() {
    return this.getTypesFromIncomingPathOfTask(this.task.id);
  }

  areAllInputsPrivate() {
    let inputTypes = this.getTypesOfAllTaskInputs();
    if (inputTypes) {
      for (let inputType of inputTypes) {
        if (!inputType.type || inputType.type != "private") {
          return false;
        }
      }
    }
    return true;
  }

  getInputsThatAreNotPrivate() {
    let inputTypes = this.getTypesOfAllTaskInputs();
    let inputs = [];
    if (inputTypes) {
      for (let inputType of inputTypes) {
        if (!inputType.type || inputType.type != "private") {
          inputs.push(inputType.inputId);
        }
      }
    }
    return inputs;
  }

  areInputAndOutputObjectsDifferent() {
    if (this.getTaskInputObjects()[0].id === this.getTaskOutputObjects()[0].id) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "OpenConfidentiality error: exactly 1 input and 1 output are required", [this.task.id], []);
    } else {
      if (!this.areInputAndOutputObjectsDifferent()) {
        this.addUniqueErrorToErrorsList(existingErrors, "OpenConfidentiality error: input and output objects must be different data objects", [this.task.id], []);
      } else {
        if (!this.areAllInputsPrivate()) {
          this.addUniqueErrorToErrorsList(existingErrors, "OpenConfidentiality error: input object is not private", [this.task.id], this.getInputsThatAreNotPrivate());
        }
      }
    }
  }

}