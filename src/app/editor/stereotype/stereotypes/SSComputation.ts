import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SSComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SSComputation", taskHandler);
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

    if (this.task.SSComputation != null) {
      inputScript = JSON.parse(this.task.SSComputation).inputScript;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SSComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#SSComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SSComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let inputScript = this.settingsPanelContainer.find('#SSComputation-inputScript').val();
    if (this.task.SSComputation == null) {
      this.addStereotypeToElement();
    }
    this.task.SSComputation = JSON.stringify({inputScript: inputScript});
    super.saveStereotypeSettings();
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}