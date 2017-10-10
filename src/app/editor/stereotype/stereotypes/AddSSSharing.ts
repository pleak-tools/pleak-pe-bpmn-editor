import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class AddSSSharing extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("AddSSSharing", taskHandler);
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

    var inputObjects = "";
    var outputObjects = "";

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#AddSSSharing-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#AddSSSharing-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (numberOfInputs != 1 || numberOfOutputs < 2) {
      this.settingsPanelContainer.find('#AddSSSharing-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#AddSSSharing-conditions-help').show();
      this.initSaveAndRemoveButtons();
    } else {
      if (this.task.AddSSSharing == null) {
        this.addStereotypeToElement();
      }
      this.task.AddSSSharing = JSON.stringify({});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}