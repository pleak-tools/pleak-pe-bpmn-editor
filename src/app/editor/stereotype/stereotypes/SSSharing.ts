import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SSSharing extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SSSharing", taskHandler);
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

    if (this.task.SSSharing != null) {
      outputConditions = JSON.parse(this.task.SSSharing).outputConditions;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SSSharing-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SSSharing-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#SSSharing-outputConditions').val(outputConditions);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (numberOfInputs == 1 && numberOfOutputs >= 2) {
      let outputConditions = this.settingsPanelContainer.find('#SSSharing-outputConditions').val();
      if (this.task.SSSharing == null) {
        this.addStereotypeToElement();
      }
      this.task.SSSharing = JSON.stringify({outputConditions: outputConditions});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SSSharing-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SSSharing-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}