import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class FunSSSharing extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("FunSSSharing", taskHandler);
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
    var outputConditions;

    if (this.task.FunSSSharing != null) {
      outputConditions = JSON.parse(this.task.FunSSSharing).outputConditions;
    } else {
      outputConditions = this.getTaskOutputObjects().length;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#FunSSSharing-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#FunSSSharing-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#FunSSSharing-outputConditions').val(outputConditions);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let outputConditions = this.settingsPanelContainer.find('#FunSSSharing-outputConditions').val();
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (outputConditions == numberOfOutputs) {
      if (this.task.FunSSSharing == null) {
        this.addStereotypeToElement();
      }
      this.task.FunSSSharing = JSON.stringify({outputConditions: outputConditions});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#FunSSSharing-outputConditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#FunSSSharing-outputConditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}