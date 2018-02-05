import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SSSharing extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SSSharing", taskHandler);
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
    let treshold;
    let computationParties;

    if (this.task.SSSharing != null) {
      treshold = JSON.parse(this.task.SSSharing).treshold;
      computationParties = JSON.parse(this.task.SSSharing).computationParties;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SSSharing-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SSSharing-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#SSSharing-treshold').val(treshold);
    this.settingsPanelContainer.find('#SSSharing-computationParties').val(computationParties);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let numberOfOutputs = this.getTaskOutputObjects().length;
      let treshold = Number(this.settingsPanelContainer.find('#SSSharing-treshold').val());
      let computationParties = Number(this.settingsPanelContainer.find('#SSSharing-computationParties').val());
      if (!this.isInteger(treshold) || treshold < 1 || treshold > numberOfOutputs) {
        this.settingsPanelContainer.find('#SSSharing-treshold-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SSSharing-treshold-help').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (!this.isInteger(computationParties) || computationParties < treshold || computationParties > numberOfOutputs) {
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        this.settingsPanelContainer.find('#SSSharing-computationParties-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SSSharing-computationParties-help').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.SSSharing == null) {
        this.addStereotypeToElement();
      }
      this.task.SSSharing = JSON.stringify({treshold: treshold, computationParties: computationParties});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SSSharing-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SSSharing-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
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
    // Outputs: at least 2
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 1 || numberOfOutputs < 2) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = JSON.parse(this.task.SSSharing);
    let treshold = Number(savedData.treshold);
    let computationParties = Number(savedData.computationParties);
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SSSharing error: exactly 1 input and at least 2 outputs are required", [this.task.id], []);
    } else {
      if (!this.isInteger(treshold) || treshold < 1 || treshold > numberOfOutputs) {
        this.addUniqueErrorToErrorsList(existingErrors, "SSSharing error: treshold must be an integer bigger than 1 and equal to or smaller than the number of outputs (1 < treshold <= number of outputs)", [this.task.id], []);
      }
      if (!this.isInteger(computationParties) || computationParties < treshold || computationParties > numberOfOutputs) {
        this.addUniqueErrorToErrorsList(existingErrors, "SSSharing error: computation parties must be an integer bigger than or equal to treshold and smaller than or equal to the number of outputs (treshold <= computation parties <= number of outputs)", [this.task.id], []);
      }
    }
    if (typeof savedData.treshold == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SSSharing error: treshold is undefined", [this.task.id], []);
    }
    if (typeof savedData.computationParties == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SSSharing error: computationParties is undefined", [this.task.id], []);
    }
  }

}