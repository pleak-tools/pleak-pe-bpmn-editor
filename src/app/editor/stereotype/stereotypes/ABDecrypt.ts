import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;

export class ABDecrypt extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("ABDecrypt", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.ABDecrypt != null) {
      return JSON.parse(this.task.ABDecrypt);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // key
  // ciphertext
  getCurrentStereotypeSettings() {
    let key = this.settingsPanelContainer.find('#ABDecrypt-keySelect').val();
    let ciphertext = this.settingsPanelContainer.find('#ABDecrypt-ciphertextSelect').val();
    return { key: key, ciphertext: ciphertext };
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

    this.settingsPanelContainer.find('#ABDecrypt-keySelect').html(keyValues);
    this.settingsPanelContainer.find('#ABDecrypt-ciphertextSelect').html(inputValues);
    this.settingsPanelContainer.find('#ABDecrypt-outputObject').html(outputObject);
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
        this.settingsPanelContainer.find('#ABDecrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABDecrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABDecrypt-ciphertext-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABDecrypt-conditions-help2').show();
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.ABDecrypt = JSON.stringify(currentStereotypeSettings);
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#ABDecrypt-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#ABDecrypt-conditions-help').show();
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

  areInputsFromTaskWithStereotypeAccepted(taskId: string) {
    // Accepted:
    // ABEncrypt
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.ABEncrypt) {
          return true;
        }
      }
    }
    return false;
  }

  isKeyObjectOfTypeABPrivate() {
    let savedData = this.getSavedStereotypeSettings();
    if (savedData.key) {
      if (!this.registry.get(savedData.key) || !this.registry.get(savedData.key).businessObject.ABPrivate) {
        return false;
      }
      return true;
    }
  }

  getKeyForEncryptedInput(inputId: string, taskId: string) {
    let keys = [];
    for (let incTask of this.getTaskHandlerByTaskId(taskId).getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(inputId)]) && this.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName("ABDecrypt").areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let incTaskOutputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskOutputObjects().map(a => a.businessObject.name.trim());
        let incTaskInputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskInputObjects().map(a => a.businessObject.name.trim());
        let inputKeyName = null;
        if (this.registry.get(incTask).businessObject.ABEncrypt) {
          inputKeyName = this.registry.get(JSON.parse(this.registry.get(incTask).businessObject.ABEncrypt).key).businessObject.name.trim();
        }
        if (inputKeyName && incTaskOutputElementsNames.indexOf(this.registry.get(inputId).businessObject.name.trim()) !== -1 && incTaskInputElementsNames.indexOf(inputKeyName) !== -1) {
          keys.push(this.registry.get(JSON.parse(this.registry.get(incTask).businessObject.ABEncrypt).key));
        }
      }
    }
    return $.unique(keys);
  }

  getKeysFromIncomingPathOfTask(taskId: string) {
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
        if (currentTaskInputKey && currentTaskInputKey.businessObject.ABPrivate && key.businessObject.ABPublic && (JSON.parse(currentTaskInputKey.businessObject.ABPrivate).groupId.trim() !== JSON.parse(key.businessObject.ABPublic).groupId.trim())) {
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

  getAttributeSubSetFromABPrivateKey(): string {
    let attributeSet = "";
    if (this.getSavedStereotypeSettings() != null) {
      let savedData = this.getSavedStereotypeSettings();
      if (typeof savedData.key != 'undefined') {
        let key = this.registry.get(savedData.key);
        if (key.businessObject.ABPrivate != null && typeof JSON.parse(key.businessObject.ABPrivate).attributeSubSet != 'undefined') {
          attributeSet = JSON.parse(key.businessObject.ABPrivate).attributeSubSet;
        }
      }
    }
    return attributeSet;
  }

  isThereIntersectionBetweenABPrivateKeyAttributesSubSetAndABEncryptionAttributesSubSet() {
    let taskId = this.task.id;
    let inputId = this.getSavedStereotypeSettings().ciphertext;
    let attributeSets = [];
    for (let incTask of this.getTaskHandlerByTaskId(taskId).getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(inputId)]) && this.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName("ABDecrypt").areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let incTaskOutputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskOutputObjects().map(a => a.businessObject.name.trim());
        let incTaskInputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskInputObjects().map(a => a.businessObject.name.trim());
        let inputKeyName = null;
        if (this.registry.get(incTask).businessObject.ABEncrypt) {
          inputKeyName = this.registry.get(JSON.parse(this.registry.get(incTask).businessObject.ABEncrypt).key).businessObject.name.trim();
        }
        if (inputKeyName && incTaskOutputElementsNames.indexOf(this.registry.get(inputId).businessObject.name.trim()) !== -1 && incTaskInputElementsNames.indexOf(inputKeyName) !== -1) {
          attributeSets.push(JSON.parse(this.registry.get(incTask).businessObject.ABEncrypt).attributeSubSet);
        }
      }
    }
    for (let attributeSet of attributeSets) {
      for (let attribute of this.getAttributeSubSetFromABPrivateKey()) {
        if (attributeSet.indexOf(attribute) !== -1) {
          return true;
        }
      }
    }
    return false;
  }

  getABEncryptTaskWhereCiphertextWasEncrypted() {
    let taskId = this.task.id;
    let inputId = this.getSavedStereotypeSettings().ciphertext;
    let ABEncryptTasks = [];
    for (let incTask of this.getTaskHandlerByTaskId(taskId).getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(inputId)]) && this.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName("ABDecrypt").areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let incTaskOutputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskOutputObjects().map(a => a.businessObject.name.trim());
        let incTaskInputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskInputObjects().map(a => a.businessObject.name.trim());
        let inputKeyName = null;
        if (this.registry.get(incTask).businessObject.ABEncrypt) {
          inputKeyName = this.registry.get(JSON.parse(this.registry.get(incTask).businessObject.ABEncrypt).key).businessObject.name.trim();
        }
        if (inputKeyName && incTaskOutputElementsNames.indexOf(this.registry.get(inputId).businessObject.name.trim()) !== -1 && incTaskInputElementsNames.indexOf(inputKeyName) !== -1) {
          ABEncryptTasks.push(incTask);
        }
      }
    }
    return ABEncryptTasks;
  }

  getABEncryptAndABDecryptPair() {
    return [this.task.id].concat(this.getABEncryptTaskWhereCiphertextWasEncrypted());
  }

  getABPublicAndABPrivateKeys() {
    let savedData = this.getSavedStereotypeSettings();
    return [savedData.key].concat(this.getKeysForAllTaskEncryptedInputs())
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = this.getSavedStereotypeSettings();
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.ciphertext)) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: ciphertext object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.key)) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: key object is missing", [this.task.id], []);
    } else {
      if (savedData.key == savedData.ciphertext) {
        this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: ciphertext and key must be different objects", [this.task.id], []);
      }
      if (!this.isKeyObjectOfTypeABPrivate()) {
        this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: key object must have ABPrivate stereotype", [this.task.id], [savedData.key]);
      } else {
        if (!this.isCiphertextCorrectlyEncrypted()) {
          this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: ciphertext is encrypted with wrong encryption method or is not encrypted", [this.task.id], []);
        } else {
          if (!this.areAllKeysFromSamePair()) {
            this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: ABPrivate key must correspond to the ABPublic key used to produce the ciphertext", [this.task.id], this.getKeysFromDifferentPairs());
          } else {
            if (!this.isThereIntersectionBetweenABPrivateKeyAttributesSubSetAndABEncryptionAttributesSubSet()) {
              this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: ciphertext cannot be decrypted (there must be at least one common attribute in both attribute subsets - in the attribute subsets of ABEncrypt task and ABPrivate key)", this.getABEncryptAndABDecryptPair(), this.getABPublicAndABPrivateKeys());
            }
          }
        }
      }
    }
    if (typeof savedData.key == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: key is undefined", [this.task.id], []);
    }
    if (typeof savedData.ciphertext == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABDecrypt error: ciphertext is undefined", [this.task.id], []);
    }
  }

}