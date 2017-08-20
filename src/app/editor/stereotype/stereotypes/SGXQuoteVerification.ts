import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare function require(name:string);
declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SGXQuoteVerification extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXQuoteVerification", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    var quoteValues;
    var certificateValues;
    var revocationListValues;
    var outputObject = "";
    var selected = null;

    if (this.task.SGXQuoteVerification != null) {
      selected = JSON.parse(this.task.SGXQuoteVerification);
    }

    for (let inputObject of this.getTaskInputObjects()) {
      var selectedQuote = "";
      var selectedCertificate = "";
      var selectedRevocationList = "";
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
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (numberOfInputs == 3 && numberOfOutputs == 1) {
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

}