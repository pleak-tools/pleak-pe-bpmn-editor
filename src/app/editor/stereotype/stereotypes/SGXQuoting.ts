import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SGXQuoting extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXQuoting", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.SGXQuoting != null) {
      return JSON.parse(this.task.SGXQuoting);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // challenge
  // measurement
  getCurrentStereotypeSettings() {
    let challenge = this.settingsPanelContainer.find('#SGXQuoting-challengeSelect').val();
    let measurement = this.settingsPanelContainer.find('#SGXQuoting-measurementSelect').val();
    return { challenge: challenge, measurement: measurement };
  }

  initStereotypePublicView() {
    super.initStereotypePublicView();
    this.highlightTaskInputAndOutputObjects();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    let challengeValues;
    let measurementValues;
    let outputObject = "";
    let selected = null;

    if (this.getSavedStereotypeSettings() != null) {
      selected = this.getSavedStereotypeSettings();
    }

    for (let inputObject of this.getTaskInputObjects()) {
      let selectedChallenge = "";
      let selectedData = "";
      if (selected !== null) {
        if (inputObject.id == selected.challenge) {
          selectedChallenge = "selected";
        }
        if (inputObject.id == selected.measurement) {
          selectedData = "selected";
        }
      }
      challengeValues += '<option ' + selectedChallenge + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      measurementValues += '<option ' + selectedData + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SGXQuoting-challengeSelect').html(challengeValues);
    this.settingsPanelContainer.find('#SGXQuoting-measurementSelect').html(measurementValues);
    this.settingsPanelContainer.find('#SGXQuoting-outputObject').html(outputObject);
    this.settingsPanelContainer.show();

  }

  terminateStereotypeSettings() {
    this.removeTaskInputsOutputsHighlights();
    super.terminateStereotypeSettings();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let currentStereotypeSettings = this.getCurrentStereotypeSettings();
      let challenge = currentStereotypeSettings.challenge;
      let measurement = currentStereotypeSettings.measurement;
      if (challenge == measurement) {
        this.settingsPanelContainer.find('#SGXQuoting-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoting-challenge-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoting-measurement-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoting-conditions-help2').show();
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.SGXQuoting = JSON.stringify(currentStereotypeSettings);
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#SGXQuoting-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXQuoting-conditions-help').show();
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
    // Outputs: public
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1 || outputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("public-io");
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
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoting error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.challenge)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoting error: challenge object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.measurement)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoting error: measurement object is missing", [this.task.id], []);
    } else {
      if (savedData.challenge == savedData.measurement) {
        this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoting error: challenge and measurement must be different objects", [this.task.id], []);
      }
    }
    if (typeof savedData.challenge == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoting error: challenge is undefined", [this.task.id], []);
    }
    if (typeof savedData.measurement == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoting error: measurement is undefined", [this.task.id], []);
    }
  }

}