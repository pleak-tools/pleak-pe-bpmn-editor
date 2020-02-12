import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class ABEncrypt extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("ABEncrypt", taskHandler);
  }

  selectedKeyId: string = null;

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.ABEncrypt != null) {
      return JSON.parse(this.task.ABEncrypt);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // key
  // inputData
  // attributeSubSet
  getCurrentStereotypeSettings() {
    let key = this.settingsPanelContainer.find('#ABEncrypt-keySelect').val();
    let inputData = this.settingsPanelContainer.find('#ABEncrypt-inputDataSelect').val();
    let attributeSet = this.getAttributeSetFromABPublicKey(key);
    let attributeSubSetTmp = this.settingsPanelContainer.find("input:checkbox[name='ABEncrypt-attribute-subset-item']:checked").map(function (_, el) {
      return $(el).val();
    }).get();
    let attributeSubSet = [];
    for (let attribute of attributeSubSetTmp) {
      if (attributeSet.indexOf(attribute) !== -1) {
        attributeSubSet.push(attribute);
      }
    }
    return { key: key, inputData: inputData, attributeSubSet: attributeSubSet };
  }

  initStereotypePublicView() {
    super.initStereotypePublicView();
    this.highlightTaskInputAndOutputObjects();
  }

  initStereotypeSettings() {
    super.initStereotypeSettings();
    this.initKeySelectDropdown();
    this.highlightTaskInputAndOutputObjects();

    let keyValues;
    let inputValues;
    let outputObject = "";
    let selected = null;
    let attributeSet = "";
    let attributeSubSet = [];
    let attributeSubSetHtml = "";
    let selectedKeyId = "";
    if (this.getTaskInputObjects().length > 0) {
      selectedKeyId = this.getTaskInputObjects()[0].id;
    }

    if (this.getSavedStereotypeSettings() != null) {
      selected = this.getSavedStereotypeSettings();
      attributeSubSet = selected.attributeSubSet;
    }

    for (let inputObject of this.getTaskInputObjects()) {
      let selectedKey = "";
      let selectedData = "";
      if (selected !== null) {
        if (inputObject.id == this.selectedKeyId) {
          selectedKey = "selected";
          selectedKeyId = inputObject.id;
        } else if (inputObject.id == selected.key) {
          selectedKey = "selected";
          selectedKeyId = inputObject.id;
        }
        if (inputObject.id == selected.inputData) {
          selectedData = "selected";
        }
      } else {
        if (inputObject.id == this.selectedKeyId) {
          selectedKey = "selected";
          selectedKeyId = inputObject.id;
        }
      }
      keyValues += '<option ' + selectedKey + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      inputValues += '<option ' + selectedData + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    if (this.selectedKeyId != null) {
      selectedKeyId = this.selectedKeyId;
    }

    attributeSet = this.getAttributeSetFromABPublicKey(selectedKeyId);

    if (attributeSet && attributeSet.length > 0) {
      let attributes = attributeSet.split(",");
      for (let attribute of attributes) {
        if (attribute.length > 0) {
          let checked = "";
          if (attributeSubSet.indexOf(attribute) !== -1) {
            checked = "checked";
          }
          attributeSubSetHtml += '<input type="checkbox" class="ABEncrypt-attribute-subset-item" name="ABEncrypt-attribute-subset-item" value="' + attribute + '" ' + checked + '> ' + attribute + '<br/>';
        }
      }
      if (attributeSubSet && attributeSubSet.length > 0) {
        let attributes = attributeSet.split(",");
        for (let attribute of attributeSubSet) {
          if (attribute.length > 0 && attributes.indexOf(attribute) === -1) {
            attributeSubSetHtml += '<input type="checkbox" class="ABEncrypt-attribute-subset-item" name="ABEncrypt-attribute-subset-item" value="' + attribute + '" checked> ' + attribute + '<br/>';
          }
        }
      }
    } else if (attributeSubSet && attributeSubSet.length > 0) {
      for (let attribute of attributeSubSet) {
        if (attribute.length > 0) {
          attributeSubSetHtml += '<input type="checkbox" class="ABEncrypt-attribute-subset-item" name="ABEncrypt-attribute-subset-item" value="' + attribute + '" checked> ' + attribute + '<br/>';
        }
      }
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#ABEncrypt-attribute-subset').html(attributeSubSetHtml);
    this.settingsPanelContainer.find('#ABEncrypt-keySelect').html(keyValues);
    this.settingsPanelContainer.find('#ABEncrypt-inputDataSelect').html(inputValues);
    this.settingsPanelContainer.find('#ABEncrypt-outputObject').html(outputObject);
    this.settingsPanelContainer.show();

  }

  terminateStereotypeSettings() {
    this.removeTaskInputsOutputsHighlights();
    this.terminateKeySelectDropdown();
    super.terminateStereotypeSettings();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let currentStereotypeSettings = this.getCurrentStereotypeSettings();
      let key = currentStereotypeSettings.key;
      let inputData = currentStereotypeSettings.inputData;
      let attributeSubSet = currentStereotypeSettings.attributeSubSet;
      if (key == inputData) {
        this.settingsPanelContainer.find('#ABEncrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABEncrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABEncrypt-inputData-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABEncrypt-conditions-help2').show();
        this.initRemoveButton();
        return;
      }
      if (!this.registry.get(key) || !this.registry.get(key).businessObject.ABPublic) {
        this.settingsPanelContainer.find('#ABEncrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABEncrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABEncrypt-conditions-help3').show();
        this.initRemoveButton();
        return;
      }
      if (attributeSubSet.length === 0) {
        this.settingsPanelContainer.find('#ABEncrypt-attribute-subset-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABEncrypt-attribute-subset-help').show();
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.ABEncrypt = JSON.stringify(currentStereotypeSettings);
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#ABEncrypt-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#ABEncrypt-conditions-help').show();
      this.initRemoveButton();
    }
  }

  reloadStereotypeSettingsWithSelectedKey(keyId: string) {
    let savedKeyId = null;
    if (this.getSavedStereotypeSettings() != null) {
      let savedData = this.getSavedStereotypeSettings();
      if (typeof savedData.key != 'undefined') {
        savedKeyId = savedData.key;
      }
    }
    // Create temporary object to save current stereotype group
    let tmpObj = { keyId: savedKeyId };
    let currentKeyObj = $.extend({}, tmpObj);

    // Terminate current dataObject stereotype settings
    this.terminateStereotypeSettings();

    // Set selected group temporarily to new selected group to init stereotype settings based on new group
    this.selectedKeyId = keyId;

    if (currentKeyObj.keyId != null) {
      this.initAllElementStereotypesSettings();
    } else {
      this.initAllElementStereotypesSettings();
      this.initStereotypeSettings();
    }

    // Set selected group back to null (in case new group is not going to be saved)
    this.selectedKeyId = null;
  }

  removeStereotype() {
    if (confirm('Are you sure you wish to remove the stereotype?')) {
      super.removeStereotype();
    } else {
      this.initRemoveButton();
      return false;
    }
  }

  initKeySelectDropdown() {
    this.settingsPanelContainer.one('change', '#ABEncrypt-keySelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedKey(e.target.value);
    });

  }

  terminateKeySelectDropdown() {
    this.settingsPanelContainer.off('change', '#ABEncrypt-keySelect');
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: string) {
    // Inputs: public
    // Outputs: private
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("public-i");
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
    // Inputs: exactly 2
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 2 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  isKeyObjectOfTypeABPublic() {
    let savedData = this.getSavedStereotypeSettings();
    if (savedData.key) {
      if (!this.registry.get(savedData.key) || !this.registry.get(savedData.key).businessObject.ABPublic) {
        return false;
      }
      return true;
    }
  }

  getAttributeSetFromABPublicKey(keyId: string): string {
    let attributeSet = "";
    if (keyId == this.task.id) {
      if (this.getSavedStereotypeSettings() != null) {
        let savedData = this.getSavedStereotypeSettings();
        if (typeof savedData.key != 'undefined') {
          let key = this.registry.get(savedData.key);
          if (key.businessObject.ABPublic != null && typeof JSON.parse(key.businessObject.ABPublic).attributeSet != 'undefined') {
            attributeSet = JSON.parse(key.businessObject.ABPublic).attributeSet;
          }
        }
      }
    } else {
      let key = this.registry.get(keyId);
      if (typeof key != 'undefined') {
        if (key.businessObject.ABPublic != null && typeof JSON.parse(key.businessObject.ABPublic).attributeSet != 'undefined') {
          attributeSet = JSON.parse(key.businessObject.ABPublic).attributeSet;
        }
      }
    }
    return attributeSet;
  }

  isSavedAttributeSetSubSetOfABPublicKeyAttributeSet(): boolean {
    let keyAttributeSet = [];
    let encryptionAttributeSubSet = [];
    if (this.getSavedStereotypeSettings() != null) {
      let savedData = this.getSavedStereotypeSettings();
      if (typeof savedData.key != 'undefined') {
        let key = this.registry.get(savedData.key);
        if (key.businessObject.ABPublic != null && typeof JSON.parse(key.businessObject.ABPublic).attributeSet != 'undefined') {
          let set = JSON.parse(key.businessObject.ABPublic).attributeSet;
          keyAttributeSet = set.split(",");
        }
      }
      if (typeof savedData.attributeSubSet != 'undefined') {
        encryptionAttributeSubSet = savedData.attributeSubSet;
      }
    }
    if (encryptionAttributeSubSet.length !== 0) {
      for (let attribute of encryptionAttributeSubSet) {
        if (keyAttributeSet.indexOf(attribute) === -1) {
          return false;
        }
      }
    }
    return true;
  }

  isAttributeSubSetNotEmpty() {
    let savedData = this.getSavedStereotypeSettings();
    if (savedData.attributeSubSet.length === 0) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = this.getSavedStereotypeSettings();
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.inputData)) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: input data object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.key)) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: key object is missing", [this.task.id], []);
    } else {
      if (savedData.key == savedData.inputData) {
        this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: input data and key must be different objects", [this.task.id], []);
      }
      if (!this.isKeyObjectOfTypeABPublic()) {
        this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: key object must have ABPublic stereotype", [this.task.id], [savedData.key]);
      }
      if (!this.isSavedAttributeSetSubSetOfABPublicKeyAttributeSet()) {
        this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: encryption attribute subset must be a subset of input key's attribute set", [this.task.id], [savedData.key]);
      }
    }
    if (typeof savedData.key == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: key is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputData == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: inputData is undefined", [this.task.id], []);
    }
    if (typeof savedData.attributeSubSet == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: attributeSubSet is undefined", [this.task.id], []);
    } else {
      if (!this.isAttributeSubSetNotEmpty()) {
        this.addUniqueErrorToErrorsList(existingErrors, "ABEncrypt error: attribute subset must not be empty", [this.task.id], []);
      }
    }
  }

}