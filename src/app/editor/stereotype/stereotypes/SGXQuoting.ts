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

    if (this.task.SGXQuoting != null) {
      selected = JSON.parse(this.task.SGXQuoting);
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
      let challenge = this.settingsPanelContainer.find('#SGXQuoting-challengeSelect').val();
      let measurement = this.settingsPanelContainer.find('#SGXQuoting-measurementSelect').val();
      if (challenge == measurement) {
        this.settingsPanelContainer.find('#SGXQuoting-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoting-challenge-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoting-measurement-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoting-conditions-help2').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.SGXQuoting == null) {
        this.addStereotypeToElement();
      }
      this.task.SGXQuoting = JSON.stringify({challenge: challenge, measurement: measurement});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SGXQuoting-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXQuoting-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: public
    // Outputs: public
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1 || outputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("public");
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
    let savedData = JSON.parse(this.task.SGXQuoting);
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