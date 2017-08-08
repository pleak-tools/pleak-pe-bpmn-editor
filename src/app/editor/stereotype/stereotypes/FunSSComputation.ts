import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class FunSSComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("FunSSComputation", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    var inputScript;
    var inputValues;
    var inputObjects = "";
    var outputObjects = "";
    var selected = null;

    if (this.task.FunSSComputation != null) {
      selected = JSON.parse(this.task.FunSSComputation);
      inputScript = selected.inputScript;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      var selectedData = "";
      if (selected !== null) {
        if (inputObject.id == selected.inputData) {
          selectedData = "selected";
        }
      }
      inputValues += '<option ' + selectedData + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#FunSSComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#FunSSComputation-inputDataSelect').html(inputValues);
    this.settingsPanelContainer.find('#FunSSComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#FunSSComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let inputData = this.settingsPanelContainer.find('#FunSSComputation-inputDataSelect').val();
    let inputScript = this.settingsPanelContainer.find('#FunSSComputation-inputScript').val();
    if (this.task.FunSSComputation == null) {
      this.addStereotypeToElement();
    }
    this.task.FunSSComputation = JSON.stringify({inputData: inputData, inputScript: inputScript});
    super.saveStereotypeSettings();
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}