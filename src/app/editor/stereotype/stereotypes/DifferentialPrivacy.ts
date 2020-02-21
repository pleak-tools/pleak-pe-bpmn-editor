import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
declare let CodeMirror: any;

let inputScriptCodeMirror;

export class DifferentialPrivacy extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("DifferentialPrivacy", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.DifferentialPrivacy != null) {
      return JSON.parse(this.task.DifferentialPrivacy);
    } else {
      return null;
    }
  }

  getSavedStereotypeScript() {
    return this.task.sqlScript != null ? this.task.sqlScript : "";
  }

  // Returns an object with properties:
  // inputScript
  // delta
  // epsilons
  getCurrentStereotypeSettings() {
    let inputScript = this.getSavedStereotypeSettings() ? this.getSavedStereotypeSettings().inputScript : ""; // this.settingsPanelContainer.find('#DifferentialPrivacy-inputScript').val();
    let delta = this.settingsPanelContainer.find('#DifferentialPrivacy-delta').val();
    let epsilons = $("input[name='epsilons\\[\\]']").map(function () {
      let input = $(this).data('input');
      let output = $(this).data('output');
      let epsilon = $(this).val();
      return { input: input, output: output, epsilon: epsilon };
    }).get();
    return { inputScript: inputScript, delta: delta, epsilons: epsilons };
  }

  initStereotypePublicView() {
    super.initStereotypePublicView();
    this.highlightTaskInputAndOutputObjects();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    let inputScript = this.getSavedStereotypeScript();
    let delta = 0;
    let epsilons;
    let inputObjects = "";
    let outputObjects = "";

    let savedStereotypeSettings = this.getSavedStereotypeSettings();
    if (this.getSavedStereotypeSettings() != null) {
      // inputScript = savedStereotypeSettings.inputScript;
      delta = savedStereotypeSettings.delta;
      epsilons = savedStereotypeSettings.epsilons;
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
          let epsilonObj = epsilons.filter(function (obj) {
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
    if (inputScriptCodeMirror) {
      inputScriptCodeMirror.toTextArea();
    }
    inputScriptCodeMirror = CodeMirror.fromTextArea(document.getElementById("DifferentialPrivacy-inputScript"), {
      mode: "text/x-mysql",
      readOnly: true,
      lineNumbers: false,
      showCursorWhenSelecting: true,
      lineWiseCopyCut: false,
      height: 100
    });
    setTimeout(() => {
      inputScriptCodeMirror.refresh();
    }, 10);

    this.settingsPanelContainer.find('#DifferentialPrivacy-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#DifferentialPrivacy-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#DifferentialPrivacy-delta').val(delta);
    this.settingsPanelContainer.find('#DifferentialPrivacy-epsilon-pairs').html(epsilonPairsTable);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    if (inputScriptCodeMirror) {
      inputScriptCodeMirror.toTextArea();
    }
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let epsilons = $("input[name='epsilons\\[\\]']").map(function () {
        let input = $(this).data('input');
        let output = $(this).data('output');
        let epsilon = $(this).val();
        return { input: input, output: output, epsilon: epsilon };
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
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.DifferentialPrivacy = JSON.stringify(this.getCurrentStereotypeSettings());
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#DifferentialPrivacy-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#DifferentialPrivacy-conditions-help').show();
      this.initRemoveButton();
    }
  }

  removeStereotype() {
    if (confirm('Are you sure you wish to remove the stereotype?')) {
      super.removeStereotype();
    } else {
      this.initRemoveButton();
      return false;
    }
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: string) {
    // Inputs: public
    // Outputs: public
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1 || outputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("public-io");
    }
    if (statuses.length > 0) {
      return statuses;
    }
    return null;
  }

  /** Validation functions */
  areInputsAndOutputsNumbersCorrect() {
    // Must have:
    // Inputs: at least 1
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs < 1 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areEpsilonValuesCorrect() {
    let savedData = this.getSavedStereotypeSettings();
    for (let i = 0; i < savedData.epsilons.length; i++) {
      if (savedData.epsilons[i].epsilon.length == 0) {
        return false;
      }
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    let savedData = this.getSavedStereotypeSettings();
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "DifferentialPrivacy error: at least 1 input and exactly 1 output are required", [this.task.id], []);
    } else {
      if (numberOfInputs * numberOfOutputs != savedData.epsilons.length) {
        this.addUniqueErrorToErrorsList(existingErrors, "DifferentialPrivacy error: number of input and output pairs does not match with the number of epsilons saved (some inputs or outputs might have been removed after adding stereotype)", [this.task.id], []);
      }
      if (!this.areEpsilonValuesCorrect()) {
        this.addUniqueErrorToErrorsList(existingErrors, "DifferentialPrivacy error: epsilon values cannot be empty", [this.task.id], []);
      }
    }
    if (typeof savedData.inputScript == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "DifferentialPrivacy error: inputScript is undefined (it can be empty, but cannot be undefined)", [this.task.id], []);
    }
    if (typeof savedData.delta == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "DifferentialPrivacy error: delta is undefined (it can be empty, but cannot be undefined)", [this.task.id], []);
    }
    if (typeof savedData.epsilons == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "DifferentialPrivacy error: epsilons are undefined", [this.task.id], []);
    }
  }

}