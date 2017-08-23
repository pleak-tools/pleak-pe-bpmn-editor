import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SKComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SKComputation", taskHandler);
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

    var inputScript;
    var inputObjects = "";
    var outputObjects = "";

    if (this.task.SKComputation != null) {
      inputScript = JSON.parse(this.task.SKComputation).inputScript;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SKComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#SKComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SKComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let inputScript = this.settingsPanelContainer.find('#SKComputation-inputScript').val();
    if (this.task.SKComputation == null) {
      this.addStereotypeToElement();
    }
    this.task.SKComputation = JSON.stringify({inputScript: inputScript});
    super.saveStereotypeSettings();
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}