import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SGXQuoteVerification extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXQuoteVerification", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.SGXQuoteVerification != null) {
      return JSON.parse(this.task.SGXQuoteVerification);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // quote
  // certificate
  // revocationList
  getCurrentStereotypeSettings() {
    let quote = this.settingsPanelContainer.find('#SGXQuoteVerification-quoteSelect').val();
    let certificate = this.settingsPanelContainer.find('#SGXQuoteVerification-certificateSelect').val();
    let revocationList = this.settingsPanelContainer.find('#SGXQuoteVerification-revocationListSelect').val();
    return {quote: quote, certificate: certificate, revocationList: revocationList};
  }

  initStereotypePublicView() {
    super.initStereotypePublicView();
    this.highlightTaskInputAndOutputObjects();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    let quoteValues;
    let certificateValues;
    let revocationListValues;
    let outputObject = "";
    let selected = null;

    if (this.getSavedStereotypeSettings() != null) {
      selected = this.getSavedStereotypeSettings();
    }

    for (let inputObject of this.getTaskInputObjects()) {
      let selectedQuote = "";
      let selectedCertificate = "";
      let selectedRevocationList = "";
      if (selected !== null) {
        if (inputObject.id == selected.quote) {
          selectedQuote = "selected";
        }
        if (inputObject.id == selected.certificate) {
          selectedCertificate = "selected";
        }
        if (inputObject.id == selected.revocationList) {
          selectedRevocationList = "selected";
        }
      }
      quoteValues += '<option ' + selectedQuote + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      certificateValues += '<option ' + selectedCertificate + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      revocationListValues += '<option ' + selectedRevocationList + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SGXQuoteVerification-quoteSelect').html(quoteValues);
    this.settingsPanelContainer.find('#SGXQuoteVerification-certificateSelect').html(certificateValues);
    this.settingsPanelContainer.find('#SGXQuoteVerification-revocationListSelect').html(revocationListValues);
    this.settingsPanelContainer.find('#SGXQuoteVerification-outputObject').html(outputObject);
    this.settingsPanelContainer.show();

  }

  terminateStereotypeSettings() {
    this.removeTaskInputsOutputsHighlights();
    super.terminateStereotypeSettings();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let currentStereotypeSettings = this.getCurrentStereotypeSettings();
      let quote = currentStereotypeSettings.quote;
      let certificate = currentStereotypeSettings.certificate;
      let revocationList = currentStereotypeSettings.revocationList;
      if ((quote == certificate && quote == revocationList) || (quote == certificate) || (quote == revocationList) || (certificate == revocationList)) {
        this.settingsPanelContainer.find('#SGXQuoteVerification-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoteVerification-quote-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoteVerification-certificate-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoteVerification-revocationList-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoteVerification-conditions-help2').show();
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.SGXQuoteVerification = JSON.stringify(currentStereotypeSettings);
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#SGXQuoteVerification-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXQuoteVerification-conditions-help').show();
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
    // Inputs: exactly 3
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 3 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areInputObjectsDifferent() {
    let savedData = this.getSavedStereotypeSettings();
    if ((savedData.quote == savedData.certificate && savedData.quote == savedData.revocationList) || (savedData.quote == savedData.certificate) || (savedData.quote == savedData.revocationList) || (savedData.certificate == savedData.revocationList)) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = this.getSavedStereotypeSettings();
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoteVerification error: exactly 3 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.quote)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoteVerification error: quote object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.certificate)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoteVerification error: certificate object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.revocationList)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoteVerification error: revocationList object is missing", [this.task.id], []);
    } else {
      if(!this.areInputObjectsDifferent()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoteVerification error: quote, certificate and revocation list must be different objects", [this.task.id], []);
      }
    }
    if (typeof savedData.quote == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoteVerification error: quote is undefined", [this.task.id], []);
    }
    if (typeof savedData.certificate == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoteVerification error: certificate is undefined", [this.task.id], []);
    }
    if (typeof savedData.revocationList == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXQuoteVerification error: revocationList is undefined", [this.task.id], []);
    }
  }

}