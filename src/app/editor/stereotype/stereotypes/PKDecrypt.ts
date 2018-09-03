import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class PKDecrypt extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("PKDecrypt", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.PKDecrypt != null) {
      return JSON.parse(this.task.PKDecrypt);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // key
  // ciphertext
  getCurrentStereotypeSettings() {
    let key = this.settingsPanelContainer.find('#PKDecrypt-keySelect').val();
    let ciphertext = this.settingsPanelContainer.find('#PKDecrypt-ciphertextSelect').val();
    return {key: key, ciphertext: ciphertext};
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

    if (this.getSavedStereotypeSettings() != null) {
      selected = this.getSavedStereotypeSettings();
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

    this.settingsPanelContainer.find('#PKDecrypt-keySelect').html(keyValues);
    this.settingsPanelContainer.find('#PKDecrypt-ciphertextSelect').html(inputValues);
    this.settingsPanelContainer.find('#PKDecrypt-outputObject').html(outputObject);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let currentStereotypeSettings = this.getCurrentStereotypeSettings();
      let key = currentStereotypeSettings.key;
      let ciphertext = currentStereotypeSettings.ciphertext;
      if (key == ciphertext) {
        this.settingsPanelContainer.find('#PKDecrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKDecrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKDecrypt-ciphertext-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKDecrypt-conditions-help2').show();
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.PKDecrypt = JSON.stringify(currentStereotypeSettings);
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#PKDecrypt-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#PKDecrypt-conditions-help').show();
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
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: if key - public, if cipherText - private
    // Outputs: public
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      let savedData = this.getSavedStereotypeSettings();
      if (savedData.key == dataObjectId) {
        statuses.push("public-i");
      } else if (savedData.ciphertext == dataObjectId) {
        statuses.push("private-i");
      }
    }
    if (outputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("public-o");
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
    // PKEncrypt
    // PKComputation
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.PKEncrypt || task.businessObject.PKComputation) {
          return true;
        }
      }
    }
    return false;
  }

  isKeyObjectOfTypePKPrivate() {
    let savedData = this.getSavedStereotypeSettings();
    if (savedData.key) {
      if (!this.registry.get(savedData.key) || !this.registry.get(savedData.key).businessObject.PKPrivate) {
        return false;
      }
      return true;
    }
  }

  getKeyForEncryptedInput(inputId: String, taskId: String) {
    let keys = [];
    for (let incTask of this.getTaskHandlerByTaskId(taskId).getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(inputId)]) && this.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName("PKDecrypt").areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let incTaskOutputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskOutputObjects().map(a => a.businessObject.name.trim());
        let incTaskInputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskInputObjects().map(a => a.businessObject.name.trim());
        let inputKeyName = null;
        if (this.registry.get(incTask).businessObject.PKComputation) {
          for (let encryptedInput of this.getTaskHandlerByTaskId(incTask).getTaskStereotypeInstanceByName("PKComputation").getTaskEncryptedInputs()) {
            let PKComputationTaskKeys = this.getTaskHandlerByTaskId(incTask).getTaskStereotypeInstanceByName("PKComputation").getKeyForEncryptedInput(encryptedInput.id, incTask);
            keys = keys.concat(PKComputationTaskKeys);
          }
        }
        if (this.registry.get(incTask).businessObject.PKEncrypt) {
          inputKeyName = this.registry.get(JSON.parse(this.registry.get(incTask).businessObject.PKEncrypt).key).businessObject.name.trim();
        }
        if (inputKeyName && incTaskOutputElementsNames.indexOf(this.registry.get(inputId).businessObject.name.trim()) !== -1 && incTaskInputElementsNames.indexOf(inputKeyName) !== -1) {
          keys.push(this.registry.get(JSON.parse(this.registry.get(incTask).businessObject.PKEncrypt).key));
        }
      }
    }
    return $.unique(keys);
  }

  getKeysFromIncomingPathOfTask(taskId: String) {
    let keys = [];
    keys = keys.concat(this.getKeyForEncryptedInput(this.getSavedStereotypeSettings().ciphertext, taskId));
    return keys;
  }

  getKeysForAllTaskEncryptedInputs() {
    return this.getKeysFromIncomingPathOfTask(this.task.id);
  }

  getKeysFromDifferentPairs() {
    let currentTaskInputKey = this.registry.get(this.getSavedStereotypeSettings().key);
    let keys = this.getKeysForAllTaskEncryptedInputs();
    let notMatchingKeys = [];
    if (keys) {
      for (let key of keys) {
        if (currentTaskInputKey && currentTaskInputKey.businessObject.PKPrivate && key.businessObject.PKPublic && (JSON.parse(currentTaskInputKey.businessObject.PKPrivate).groupId.trim() !== JSON.parse(key.businessObject.PKPublic).groupId.trim())) {
          notMatchingKeys.push(currentTaskInputKey);
          notMatchingKeys.push(key.id);
        }
      }
    }
    return notMatchingKeys;
  }

  areAllKeysFromSamePair() {
    let keys = this.getKeysFromDifferentPairs();
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
    let savedData = this.getSavedStereotypeSettings();
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "PKDecrypt error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.ciphertext)) {
      this.addUniqueErrorToErrorsList(existingErrors, "PKDecrypt error: ciphertext object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.key)) {
      this.addUniqueErrorToErrorsList(existingErrors, "PKDecrypt error: key object is missing", [this.task.id], []);
    } else {
      if (savedData.key == savedData.ciphertext) {
        this.addUniqueErrorToErrorsList(existingErrors, "PKDecrypt error: ciphertext and key must be different objects", [this.task.id], []);
      }
      if (!this.isKeyObjectOfTypePKPrivate()) {
        this.addUniqueErrorToErrorsList(existingErrors, "PKDecrypt error: key object must have PKPrivate stereotype", [this.task.id], [savedData.key]);
      } else {
        if (!this.isCiphertextCorrectlyEncrypted()) {
          this.addUniqueErrorToErrorsList(existingErrors, "PKDecrypt error: ciphertext is encrypted with wrong encryption method or is not encrypted", [this.task.id], []);
        } else {
          if (!this.areAllKeysFromSamePair()) {
            this.addUniqueErrorToErrorsList(existingErrors, "PKDecrypt error: all keys must be from the same PKPublic-PKPrivate key pair", [this.task.id], this.getKeysFromDifferentPairs());
          }
        }
      }
    }
    if (typeof savedData.key == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "PKDecrypt error: key is undefined", [this.task.id], []);
    }
    if (typeof savedData.ciphertext == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "PKDecrypt error: ciphertext is undefined", [this.task.id], []);
    }
  }

}