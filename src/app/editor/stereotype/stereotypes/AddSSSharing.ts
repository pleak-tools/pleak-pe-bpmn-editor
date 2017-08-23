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
    var outputConditions;

    if (this.task.AddSSSharing != null) {
      outputConditions = JSON.parse(this.task.AddSSSharing).outputConditions;
    } else {
      outputConditions = this.getTaskOutputObjects().length;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#AddSSSharing-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#AddSSSharing-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#AddSSSharing-outputConditions').val(outputConditions);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let outputConditions = this.settingsPanelContainer.find('#AddSSSharing-outputConditions').val();
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (numberOfInputs != 1 || numberOfOutputs < 2) {
      this.settingsPanelContainer.find('#AddSSSharing-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#AddSSSharing-conditions-help').show();
      this.initSaveAndRemoveButtons();
    } else if (outputConditions != numberOfOutputs) {
      this.settingsPanelContainer.find('#AddSSSharing-outputConditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#AddSSSharing-outputConditions-help').show();
      this.initSaveAndRemoveButtons();
    } else {
      if (this.task.AddSSSharing == null) {
        this.addStereotypeToElement();
      }
      this.task.AddSSSharing = JSON.stringify({outputConditions: outputConditions});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}