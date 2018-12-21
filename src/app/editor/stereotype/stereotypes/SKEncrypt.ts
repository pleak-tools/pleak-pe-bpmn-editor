import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SKEncrypt extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SKEncrypt", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.SKEncrypt != null) {
      return JSON.parse(this.task.SKEncrypt);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // key
  // inputData
  getCurrentStereotypeSettings() {
    let key = this.settingsPanelContainer.find('#SKEncrypt-keySelect').val();
    let inputData = this.settingsPanelContainer.find('#SKEncrypt-inputDataSelect').val();
    return { key: key, inputData: inputData };
  }

  initStereotypePublicView() {
    super.initStereotypePublicView();
    this.highlightTaskInputAndOutputObjects();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    let keyValues;
    let inputValues;
    let outputObject = "";
    let selected = null;

    if (this.getSavedStereotypeSettings() != null) {
      selected = this.getSavedStereotypeSettings();
    }

    for (let inputObject of this.getTaskInputObjects()) {
      let selectedKey = "";
      let selectedData = "";
      if (selected !== null) {
        if (inputObject.id == selected.key) {
          selectedKey = "selected";
        }
        if (inputObject.id == selected.inputData) {
          selectedData = "selected";
        }
      }
      keyValues += '<option ' + selectedKey + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      inputValues += '<option ' + selectedData + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SKEncrypt-keySelect').html(keyValues);
    this.settingsPanelContainer.find('#SKEncrypt-inputDataSelect').html(inputValues);
    this.settingsPanelContainer.find('#SKEncrypt-outputObject').html(outputObject);
    this.settingsPanelContainer.show();

  }

  terminateStereotypeSettings() {
    this.removeTaskInputsOutputsHighlights();
    super.terminateStereotypeSettings();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let currentStereotypeSettings = this.getCurrentStereotypeSettings();
      let key = currentStereotypeSettings.key;
      let inputData = currentStereotypeSettings.inputData;
      if (key == inputData) {
        this.settingsPanelContainer.find('#SKEncrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKEncrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKEncrypt-inputData-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKEncrypt-conditions-help2').show();
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.SKEncrypt = JSON.stringify(currentStereotypeSettings);
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#SKEncrypt-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SKEncrypt-conditions-help').show();
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
    // Inputs: exactly 2
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 2 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = this.getSavedStereotypeSettings();
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SKEncrypt error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.inputData)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SKEncrypt error: input data object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.key)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SKEncrypt error: key object is missing", [this.task.id], []);
    } else {
      if (savedData.key == savedData.inputData) {
        this.addUniqueErrorToErrorsList(existingErrors, "SKEncrypt error: input data and key must be different objects", [this.task.id], []);
      }
    }
    if (typeof savedData.key == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SKEncrypt error: key is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputData == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SKEncrypt error: inputData is undefined", [this.task.id], []);
    }
  }

}