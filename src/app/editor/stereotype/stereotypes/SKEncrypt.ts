import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare function require(name:string);
declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SKEncrypt extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SKEncrypt", taskHandler);
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

    if (this.task.SKEncrypt != null) {
      selected = JSON.parse(this.task.SKEncrypt);
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
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (numberOfInputs == 2 && numberOfOutputs == 1) {
      let key = this.settingsPanelContainer.find('#SKEncrypt-keySelect').val();
      let inputData = this.settingsPanelContainer.find('#SKEncrypt-inputDataSelect').val();
      if (key == inputData) {
        this.settingsPanelContainer.find('#SKEncrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKEncrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKEncrypt-inputData-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKEncrypt-conditions-help2').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.SKEncrypt == null) {
        this.addStereotypeToElement();
      }
      this.task.SKEncrypt = JSON.stringify({key: key, inputData: inputData});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SKEncrypt-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SKEncrypt-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}