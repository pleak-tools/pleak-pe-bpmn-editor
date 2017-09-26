import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class DifferentialPrivacy extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("DifferentialPrivacy", taskHandler);
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
    var delta = 0;
    var epsilons;
    var inputObjects = "";
    var outputObjects = "";

    if (this.task.DifferentialPrivacy != null) {
      inputScript = JSON.parse(this.task.DifferentialPrivacy).inputScript;
      delta = JSON.parse(this.task.DifferentialPrivacy).delta;
      epsilons = JSON.parse(this.task.DifferentialPrivacy).epsilons;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    let epsilonPairsTable = '<table style="width:100%"><tbody><tr><th>Input</th><th>Output</th></tr>';
    for (let inputObj of this.getTaskInputObjects()) {
      for (let outputObj of this.getTaskOutputObjects()) {
        let epsilon = "";
        if (epsilons) {
          let epsilonObj = epsilons.filter(function( obj ) {
            return obj.input == inputObj.businessObject.id && obj.output == outputObj.businessObject.id;
          });
          if (epsilonObj.length > 0) {
            epsilon = epsilonObj[0].epsilon;
          }
        }
        epsilonPairsTable += '<tr><td>' + inputObj.businessObject.name + '</td><td>' + outputObj.businessObject.name + '</td></tr>';
        epsilonPairsTable += '<tr><td colspan="2"><input class="form-control stereotype-option" type="number" name="epsilons[]" data-input="' + inputObj.businessObject.id + '" data-output="' + outputObj.businessObject.id + '" value="' + epsilon + '"/></td></tr>';
      }
    }
    epsilonPairsTable += '</tbody></table>';

    this.settingsPanelContainer.find('#DifferentialPrivacy-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#DifferentialPrivacy-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#DifferentialPrivacy-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#DifferentialPrivacy-delta').val(delta);
    this.settingsPanelContainer.find('#DifferentialPrivacy-epsilon-pairs').html(epsilonPairsTable);
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
      let inputScript = this.settingsPanelContainer.find('#DifferentialPrivacy-inputScript').val();
      let delta = this.settingsPanelContainer.find('#DifferentialPrivacy-delta').val();
      let epsilons = $("input[name='epsilons\\[\\]']").map(function() {
        let input = $(this).data('input');
        let output = $(this).data('output');
        let epsilon = $(this).val();
        return {input: input, output: output, epsilon: epsilon};
      }).get();
      let flag = false;
      for (let i = 0; i < epsilons.length; i++) {
        if (epsilons[i].epsilon.length == 0) {
          flag = true;
          break;
        }
      }
      if (flag) {
        this.settingsPanelContainer.find('#DifferentialPrivacy-epsilon-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#DifferentialPrivacy-epsilon-conditions-help').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.DifferentialPrivacy == null) {
        this.addStereotypeToElement();
      }
      this.task.DifferentialPrivacy = JSON.stringify({inputScript: inputScript, delta: delta, epsilons: epsilons});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#DifferentialPrivacy-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#DifferentialPrivacy-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

}