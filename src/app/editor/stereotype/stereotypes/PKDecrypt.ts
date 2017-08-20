import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class PKDecrypt extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("PKDecrypt", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    var keyValues;
    var inputValues;
    var outputObject = "";
    var selected = null;

    if (this.task.PKDecrypt != null) {
      selected = JSON.parse(this.task.PKDecrypt);
    }

    for (let inputObject of this.getTaskInputObjects()) {
      var selectedKey = "";
      var selectedData = "";
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

    this.settingsPanelContainer.find('#PKDecrypt-keySelect').html(keyValues);
    this.settingsPanelContainer.find('#PKDecrypt-inputDataSelect').html(inputValues);
    this.settingsPanelContainer.find('#PKDecrypt-outputObject').html(outputObject);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (numberOfInputs == 2 && numberOfOutputs == 1) {
      let key = this.settingsPanelContainer.find('#PKDecrypt-keySelect').val();
      let inputData = this.settingsPanelContainer.find('#PKDecrypt-inputDataSelect').val();
      if (key == inputData) {
        this.settingsPanelContainer.find('#PKDecrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKDecrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKDecrypt-inputData-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKDecrypt-conditions-help2').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.PKDecrypt == null) {
        this.addStereotypeToElement();
      }
      this.task.PKDecrypt = JSON.stringify({key: key, inputData: inputData});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#PKDecrypt-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#PKDecrypt-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}