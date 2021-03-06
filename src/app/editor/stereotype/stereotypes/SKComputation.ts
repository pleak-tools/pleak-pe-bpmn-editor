import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
declare let CodeMirror: any;

let inputScriptCodeMirror;

export class SKComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SKComputation", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.SKComputation != null) {
      return JSON.parse(this.task.SKComputation);
    } else {
      return null;
    }
  }

  getSavedStereotypeScript() {
    return this.task.sqlScript != null ? this.task.sqlScript : "";
  }

  // Returns an object with properties:
  // inputScript
  // inputTypes
  getCurrentStereotypeSettings() {
    let inputScript = this.getSavedStereotypeSettings() ? this.getSavedStereotypeSettings().inputScript : ""; // this.settingsPanelContainer.find('#SKComputation-inputScript').val();
    let inputTypes = [];
    for (let inputObject of this.getTaskInputObjects()) {
      let type = $('#SKComputation-input-type-select-' + inputObject.id).val();
      inputTypes.push({ id: inputObject.id, type: type });
    }
    return { inputScript: inputScript, inputTypes: inputTypes };
  }

  initStereotypePublicView() {
    super.initStereotypePublicView();
    this.highlightTaskInputAndOutputObjects();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    let inputScript = this.getSavedStereotypeScript();
    let inputObjects = "";
    let outputObjects = "";
    let selected = null;
    let inputTypes = null;

    if (this.getSavedStereotypeSettings() != null) {
      selected = this.getSavedStereotypeSettings();
      // inputScript = selected.inputScript;
      if (selected.inputTypes) {
        inputTypes = selected.inputTypes
      }
    }

    for (let inputObject of this.getTaskInputObjects()) {
      let selectedPublic = "";
      let selectedEncrypted = "";
      if (inputTypes !== null) {
        for (let inputType of inputTypes) {
          if (inputType.id == inputObject.id) {
            if (inputType.type == "public") {
              selectedPublic = "selected";
            }
            if (inputType.type == "encrypted") {
              selectedEncrypted = "selected";
            }
          }
        }
      } else {
        selectedEncrypted = "selected";
      }
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
      inputObjects += '<select class="form-control stereotype-option" id="SKComputation-input-type-select-' + inputObject.id + '">';
      inputObjects += '<option ' + selectedPublic + ' value="public">Public</option>';
      inputObjects += '<option ' + selectedEncrypted + ' value="encrypted">Encrypted</option>';
      inputObjects += '</select>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SKComputation-inputScript').val(inputScript);
    if (inputScriptCodeMirror) {
      inputScriptCodeMirror.toTextArea();
    }
    inputScriptCodeMirror = CodeMirror.fromTextArea(document.getElementById("SKComputation-inputScript"), {
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

    this.settingsPanelContainer.find('#SKComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SKComputation-outputObjects').html(outputObjects);
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
      let flag = false;
      for (let inputObject of this.getTaskInputObjects()) {
        let type = $('#SKComputation-input-type-select-' + inputObject.id).val();
        if (type == "encrypted") {
          flag = true;
        }
      }
      if (!flag) {
        this.settingsPanelContainer.find('#SKComputation-inputObjects-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKComputation-inputObjects-help').show();
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.SKComputation = JSON.stringify(this.getCurrentStereotypeSettings());
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#SKComputation-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SKComputation-conditions-help').show();
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
    // Inputs: if encrypted - private, if public - public
    // Outputs: private
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      let encryptedInputIds = this.getTaskEncryptedInputs().map(a => a.id);
      if (encryptedInputIds.indexOf(dataObjectId) !== -1) {
        statuses.push("private-i");
      } else if (encryptedInputIds.indexOf(dataObjectId) === -1) {
        statuses.push("public-i");
      }
    }
    if (outputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("private-o");
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

  areInputsFromTaskWithStereotypeAccepted(taskId: string) {
    // Accepted:
    // SKEncrypt
    // SKComputation
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.SKEncrypt || task.businessObject.SKComputation) {
          return true;
        }
      }
    }
    return false;
  }

  isThereAtLeastOneEncryptedInput() {
    let savedData = this.getSavedStereotypeSettings();
    if (savedData.inputTypes) {
      for (let inputType of savedData.inputTypes) {
        if (inputType.type == "encrypted") {
          return true;
        }
      }
    }
    return false;
  }

  getTaskEncryptedInputs() {
    let encryptedInputObjects = [];
    let inputObjects = this.getTaskInputObjects();
    let savedData = this.getSavedStereotypeSettings();
    if (savedData.inputTypes && inputObjects.length > 0) {
      for (let inputObject of inputObjects) {
        let matchingInputs = savedData.inputTypes.filter(function (obj) {
          return obj.id === inputObject.id;
        });
        if (matchingInputs.length === 1) {
          if (matchingInputs[0].type == "encrypted") {
            encryptedInputObjects.push(inputObject);
          }
        }
      }
    }
    return encryptedInputObjects;
  }

  getKeyForEncryptedInput(inputId: string, taskId: string) {
    let keys = [];
    for (let incTask of this.getTaskHandlerByTaskId(taskId).getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(inputId)]) && this.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName("SKComputation").areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let incTaskOutputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskOutputObjects().map(a => a.businessObject.name.trim());
        let incTaskInputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskInputObjects().map(a => a.businessObject.name.trim());
        let inputKeyName = null;
        if (this.registry.get(incTask).businessObject.SKComputation) {
          for (let encryptedInput of this.getTaskHandlerByTaskId(incTask).getTaskStereotypeInstanceByName("SKComputation").getTaskEncryptedInputs()) {
            let SKComputationTaskKeys = this.getTaskHandlerByTaskId(incTask).getTaskStereotypeInstanceByName("SKComputation").getKeyForEncryptedInput(encryptedInput.id, incTask);
            keys = keys.concat(SKComputationTaskKeys);
          }
        }
        if (this.registry.get(incTask).businessObject.SKEncrypt) {
          inputKeyName = this.registry.get(JSON.parse(this.registry.get(incTask).businessObject.SKEncrypt).key).businessObject.name.trim();
        }
        if (inputKeyName && incTaskOutputElementsNames.indexOf(this.registry.get(inputId).businessObject.name.trim()) !== -1 && incTaskInputElementsNames.indexOf(inputKeyName) !== -1) {
          keys.push(this.registry.get(JSON.parse(this.registry.get(incTask).businessObject.SKEncrypt).key));
        }
      }
    }
    return this.getUniqueValuesOfArray(keys);
  }

  getKeysFromIncomingPathOfTask(taskId: string) {
    let keys = [];
    for (let encryptedInput of this.getTaskEncryptedInputs()) {
      keys = keys.concat(this.getKeyForEncryptedInput(encryptedInput.id, taskId));
    }
    return keys;
  }

  getKeysForAllTaskEncryptedInputs() {
    return this.getKeysFromIncomingPathOfTask(this.task.id);
  }

  areKeysTheSameForAllEncryptedInputs() {
    let keys = this.getKeysForAllTaskEncryptedInputs();
    let keysNames = [];
    if (keys) {
      keysNames = this.getUniqueValuesOfArray(keys.map(a => a.businessObject.name.trim()));
    }
    if (keysNames.length > 1) {
      return false;
    }
    return true;
  }

  getInputsThatAreMarkedAsEncryptedButAreNotEncrypted() {
    let inputs = [];
    for (let encryptedInput of this.getTaskEncryptedInputs()) {
      let keys = this.getKeyForEncryptedInput(encryptedInput.id, this.task.id);
      if (keys.length === 0) {
        inputs.push(encryptedInput.id);
      }
    }
    return inputs;
  }

  areInputsSelectedAsEncryptedReallyEncrypted() {
    if (this.getInputsThatAreMarkedAsEncryptedButAreNotEncrypted().length > 0) {
      return false;
    }
    return true;
  }

  doAllInputElementsExist() {
    let savedData = this.getSavedStereotypeSettings();
    for (let input of savedData.inputTypes) {
      if (!this.taskHasInputElement(input.id)) {
        return false;
      }
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = this.getSavedStereotypeSettings();
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SKComputation error: at least 1 input and exactly 1 output are required", [this.task.id], []);
    } else {
      if (!this.isThereAtLeastOneEncryptedInput()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SKComputation error: at least 1 input must be selected as encrypted", [this.task.id], []);
      }
      if (!this.areKeysTheSameForAllEncryptedInputs()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SKComputation error: key must be the same (with the same name) for all inputs", [this.task.id], this.getKeysForAllTaskEncryptedInputs());
      } else {
        if (!this.areInputsSelectedAsEncryptedReallyEncrypted()) {
          this.addUniqueErrorToErrorsList(existingErrors, "SKComputation error: all inputs marked as encrypted are not encrypted", [this.task.id], this.getInputsThatAreMarkedAsEncryptedButAreNotEncrypted());
        }
      }
    }
    if (typeof savedData.inputScript == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SKComputation error: inputScript is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputTypes == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SKComputation error: inputTypes is undefined", [this.task.id], []);
    } else {
      if (!this.doAllInputElementsExist()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SKComputation error: one or more input data objects are missing", [this.task.id], []);
      }
    }
  }

}