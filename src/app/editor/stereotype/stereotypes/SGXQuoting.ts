import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare function require(name:string);
declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class SGXQuoting extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXQuoting", taskHandler);
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

    var challengeValues;
    var measurementValues;
    var outputObject = "";
    var selected = null;

    if (this.task.SGXQuoting != null) {
      selected = JSON.parse(this.task.SGXQuoting);
    }

    for (let inputObject of this.getTaskInputObjects()) {
      var selectedChallenge = "";
      var selectedData = "";
      if (selected !== null) {
        if (inputObject.id == selected.challenge) {
          selectedChallenge = "selected";
        }
        if (inputObject.id == selected.measurement) {
          selectedData = "selected";
        }
      }
      challengeValues += '<option ' + selectedChallenge + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      measurementValues += '<option ' + selectedData + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SGXQuoting-challengeSelect').html(challengeValues);
    this.settingsPanelContainer.find('#SGXQuoting-measurementSelect').html(measurementValues);
    this.settingsPanelContainer.find('#SGXQuoting-outputObject').html(outputObject);
    this.settingsPanelContainer.show();

  }

  terminateStereotypeSettings() {
    this.removeTaskInputsOutputsHighlights();
    super.terminateStereotypeSettings();
  }

  saveStereotypeSettings() {
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (numberOfInputs == 2 && numberOfOutputs == 1) {
      let challenge = this.settingsPanelContainer.find('#SGXQuoting-challengeSelect').val();
      let measurement = this.settingsPanelContainer.find('#SGXQuoting-measurementSelect').val();
      if (challenge == measurement) {
        this.settingsPanelContainer.find('#SGXQuoting-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoting-challenge-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoting-measurement-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXQuoting-conditions-help2').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.SGXQuoting == null) {
        this.addStereotypeToElement();
      }
      this.task.SGXQuoting = JSON.stringify({challenge: challenge, measurement: measurement});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SGXQuoting-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXQuoting-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}