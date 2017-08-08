import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class AddSSComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("AddSSComputation", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    var inputScript;
    var inputObjects = "";
    var outputObjects = "";

    if (this.task.AddSSComputation != null) {
      inputScript = JSON.parse(this.task.AddSSComputation).inputScript;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#AddSSComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#AddSSComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#AddSSComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let inputScript = this.settingsPanelContainer.find('#AddSSComputation-inputScript').val();
    if (this.task.AddSSComputation == null) {
      this.addStereotypeToElement();
    }
    this.task.AddSSComputation = JSON.stringify({inputScript: inputScript});
    super.saveStereotypeSettings();
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}