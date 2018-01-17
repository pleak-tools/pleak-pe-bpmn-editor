import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SKDecrypt extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SKDecrypt", taskHandler);
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

    let keyValues;
    let inputValues;
    let outputObject = "";
    let selected = null;

    if (this.task.SKDecrypt != null) {
      selected = JSON.parse(this.task.SKDecrypt);
    }

    for (let inputObject of this.getTaskInputObjects()) {
      let selectedKey = "";
      let selectedData = "";
      if (selected !== null) {
        if (inputObject.id == selected.key) {
          selectedKey = "selected";
        }
        if (inputObject.id == selected.ciphertext) {
          selectedData = "selected";
        }
      }
      keyValues += '<option ' + selectedKey + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      inputValues += '<option ' + selectedData + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#SKDecrypt-keySelect').html(keyValues);
    this.settingsPanelContainer.find('#SKDecrypt-ciphertextSelect').html(inputValues);
    this.settingsPanelContainer.find('#SKDecrypt-outputObject').html(outputObject);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let key = this.settingsPanelContainer.find('#SKDecrypt-keySelect').val();
      let ciphertext = this.settingsPanelContainer.find('#SKDecrypt-ciphertextSelect').val();
      if (key == ciphertext) {
        this.settingsPanelContainer.find('#SKDecrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKDecrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKDecrypt-ciphertext-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SKDecrypt-conditions-help2').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.SKDecrypt == null) {
        this.addStereotypeToElement();
      }
      this.task.SKDecrypt = JSON.stringify({key: key, ciphertext: ciphertext});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SKDecrypt-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SKDecrypt-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: if key - public, if cipherText - private
    // Outputs: public
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      let savedData = JSON.parse(this.task.SKDecrypt);
      if (savedData.key == dataObjectId) {
        statuses.push("public");
      } else if (savedData.ciphertext == dataObjectId) {
        statuses.push("private");
      }
    }
    if (outputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("public");
    }
    if (statuses.length > 0) {
      return statuses;
    }
    return null;
  }

  /** Validation functions */
  areInputsAndOutputsNumbersCorrect() {
    // Must have:
    // Inputs: exactly 2
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 2 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areInputsFromTaskWithStereotypeAccepted(taskId: String) {
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

  getKeyForEncryptedInput(inputId: String, taskId: String) {
    let keys = [];
    for (let incTask of this.getTaskHandlerByTaskId(taskId).getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(inputId)]) && this.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName("SKDecrypt").areInputsFromTaskWithStereotypeAccepted(incTask)) {
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
    return $.unique(keys);
  }

  getKeysFromIncomingPathOfTask(taskId: String) {
    let keys = [];
    keys = keys.concat(this.getKeyForEncryptedInput(JSON.parse(this.task.SKDecrypt).ciphertext, taskId));
    return keys;
  }

  getKeysForAllTaskEncryptedInputs() {
    return this.getKeysFromIncomingPathOfTask(this.task.id);
  }

  getKeysWithDifferentNames() {
    let currentTaskInputKey = this.registry.get(JSON.parse(this.task.SKDecrypt).key);
    let keys = this.getKeysForAllTaskEncryptedInputs();
    let notMatchingKeys = [];
    if (keys) {
      for (let key of keys) {
        if (currentTaskInputKey && currentTaskInputKey.businessObject.name.trim() !== key.businessObject.name.trim()) {
          notMatchingKeys.push(currentTaskInputKey);
          notMatchingKeys.push(key.id);
        }
      }
    }
    return notMatchingKeys;
  }

  areAllKeysWithSameName() {
    let keys = this.getKeysWithDifferentNames();
    if (keys.length > 0) {
      return false;
    }
    return true;
  }

  isCiphertextCorrectlyEncrypted() {
    let keys = this.getKeysFromIncomingPathOfTask(this.task.id);
    if (keys.length < 1) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = JSON.parse(this.task.SKDecrypt);
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SKDecrypt error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.ciphertext)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SKDecrypt error: ciphertext object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.key)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SKDecrypt error: key object is missing", [this.task.id], []);
    } else {
      if (savedData.key == savedData.ciphertext) {
        this.addUniqueErrorToErrorsList(existingErrors, "SKDecrypt error: ciphertext and key must be different objects", [this.task.id], []);
      }
      if (!this.isCiphertextCorrectlyEncrypted()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SKDecrypt error: ciphertext is encrypted with wrong encryption method or is not encrypted", [this.task.id], []);
      } else {
        if (!this.areAllKeysWithSameName()) {
          this.addUniqueErrorToErrorsList(existingErrors, "SKDecrypt error: decryption key must be the same (with the same name) as the encryption key", [this.task.id], this.getKeysWithDifferentNames());
        }
      }
    }
    if (typeof savedData.key == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SKDecrypt error: key is undefined", [this.task.id], []);
    }
    if (typeof savedData.ciphertext == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SKDecrypt error: ciphertext is undefined", [this.task.id], []);
    }
  }

}