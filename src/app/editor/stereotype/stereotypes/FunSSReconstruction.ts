import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class FunSSReconstruction extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("FunSSReconstruction", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    var inputObjects = "";
    var outputObjects = "";

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#FunSSReconstruction-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#FunSSReconstruction-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    if (this.task.FunSSReconstruction == null) {
      this.addStereotypeToElement();
    }
    this.task.FunSSReconstruction = JSON.stringify({});
    super.saveStereotypeSettings();
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}