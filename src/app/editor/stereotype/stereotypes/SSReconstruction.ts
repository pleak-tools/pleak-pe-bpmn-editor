import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SSReconstruction extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SSReconstruction", taskHandler);
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

    this.settingsPanelContainer.find('#SSReconstruction-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SSReconstruction-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfOutputs == 1 && numberOfInputs >= 2) {
      if (this.task.SSReconstruction == null) {
        this.addStereotypeToElement();
      }
      this.task.SSReconstruction = JSON.stringify({});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SSReconstruction-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SSReconstruction-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}