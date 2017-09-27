import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SGXComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXComputation", taskHandler);
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

    if (this.task.SGXComputation != null) {
      inputScript = JSON.parse(this.task.SGXComputation).inputScript;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SGXComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#SGXComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SGXComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (numberOfInputs >= 1 && numberOfOutputs >= 1) {
      let inputScript = this.settingsPanelContainer.find('#SGXComputation-inputScript').val();
      if (this.task.SGXComputation == null) {
        this.addStereotypeToElement();
      }
      this.task.SGXComputation = JSON.stringify({inputScript: inputScript});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SGXComputation-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXComputation-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}