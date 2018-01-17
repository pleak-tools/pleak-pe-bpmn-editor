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

    if (this.task.SGXQuoteVerification != null) {
      selected = JSON.parse(this.task.SGXQuoteVerification);
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
      let quote = this.settingsPanelContainer.find('#SGXQuoteVerification-quoteSelect').val();
      let certificate = this.settingsPanelContainer.find('#SGXQuoteVerification-certificateSelect').val();
      let revocationList = this.settingsPanelContainer.find('#SGXQuoteVerification-revocationListSelect').val();
      if ((quote == certificate && quote == revocationList) || (quote == certificate) || (quote == revocationList) || (certificate == revocationList)) {
        this.settingsPanelContainer.find('#SGXQuoteVerification-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoteVerification-quote-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoteVerification-certificate-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoteVerification-revocationList-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoteVerification-conditions-help2').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.SGXQuoteVerification == null) {
        this.addStereotypeToElement();
      }
      this.task.SGXQuoteVerification = JSON.stringify({quote: quote, certificate: certificate, revocationList: revocationList});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SGXQuoteVerification-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXQuoteVerification-conditions-help').show();
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
    let savedData = JSON.parse(this.task.SGXQuoteVerification);
    if ((savedData.quote == savedData.certificate && savedData.quote == savedData.revocationList) || (savedData.quote == savedData.certificate) || (savedData.quote == savedData.revocationList) || (savedData.certificate == savedData.revocationList)) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = JSON.parse(this.task.SGXQuoteVerification);
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