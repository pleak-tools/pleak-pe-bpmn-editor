import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SKDecrypt extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SKDecrypt", taskHandler);
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

    if (this.task.SKDecrypt != null) {
      selected = JSON.parse(this.task.SKDecrypt);
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

    this.settingsPanelContainer.find('#SKDecrypt-keySelect').html(keyValues);
    this.settingsPanelContainer.find('#SKDecrypt-inputDataSelect').html(inputValues);
    this.settingsPanelContainer.find('#SKDecrypt-outputObject').html(outputObject);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let key = this.settingsPanelContainer.find('#SKDecrypt-keySelect').val();
    let inputData = this.settingsPanelContainer.find('#SKDecrypt-inputDataSelect').val();
    if (this.task.SKDecrypt == null) {
      this.addStereotypeToElement();
    }
    this.task.SKDecrypt = JSON.stringify({key: key, inputData: inputData});
    super.saveStereotypeSettings();
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}