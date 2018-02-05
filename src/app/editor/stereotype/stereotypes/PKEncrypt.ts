import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class PKEncrypt extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("PKEncrypt", taskHandler);
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

    if (this.task.PKEncrypt != null) {
      selected = JSON.parse(this.task.PKEncrypt);
    }

    for (let inputObject of this.getTaskInputObjects()) {
      let selectedKey = "";
      let selectedData = "";
      if (selected !== null) {
        if (inputObject.id == selected.key) {
          selectedKey = "selected";
        }
        if (inputObject.id == selected.inputData) {
          selectedData = "selected";
        }
      }
      keyValues += '<option ' + selectedKey + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      inputValues += '<option ' + selectedData + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#PKEncrypt-keySelect').html(keyValues);
    this.settingsPanelContainer.find('#PKEncrypt-inputDataSelect').html(inputValues);
    this.settingsPanelContainer.find('#PKEncrypt-outputObject').html(outputObject);
    this.settingsPanelContainer.show();

  }

  terminateStereotypeSettings() {
    this.removeTaskInputsOutputsHighlights();
    super.terminateStereotypeSettings();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let key = this.settingsPanelContainer.find('#PKEncrypt-keySelect').val();
      let inputData = this.settingsPanelContainer.find('#PKEncrypt-inputDataSelect').val();
      if (key == inputData) {
        this.settingsPanelContainer.find('#PKEncrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKEncrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKEncrypt-inputData-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKEncrypt-conditions-help2').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (!this.registry.get(key) || !this.registry.get(key).businessObject.PKPublic) {
        this.settingsPanelContainer.find('#PKEncrypt-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKEncrypt-key-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#PKEncrypt-conditions-help3').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.PKEncrypt == null) {
        this.addStereotypeToElement();
      }
      this.task.PKEncrypt = JSON.stringify({key: key, inputData: inputData});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#PKEncrypt-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#PKEncrypt-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: public
    // Outputs: private
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      if (this.task.SGXComputation != null) {
        let savedData = JSON.parse(this.task.SGXComputation);
        if (savedData.inputScript.type == "stereotype") {
          return this.getTaskHandlerByTaskId(this.task.id).getTaskStereotypeInstanceByName("SGXComputation").getDataObjectVisibilityStatus(dataObjectId);
        }
      }
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

  isKeyObjectOfTypePKPublic() {
    let savedData = JSON.parse(this.task.PKEncrypt);
    if (savedData.key) {
      if (!this.registry.get(savedData.key) || !this.registry.get(savedData.key).businessObject.PKPublic) {
        return false;
      }
      return true;
    }
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = JSON.parse(this.task.PKEncrypt);
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "PKEncrypt error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.inputData)) {
      this.addUniqueErrorToErrorsList(existingErrors, "PKEncrypt error: input data object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.key)) {
      this.addUniqueErrorToErrorsList(existingErrors, "PKEncrypt error: key object is missing", [this.task.id], []);
    } else {
      if (savedData.key == savedData.inputData) {
        this.addUniqueErrorToErrorsList(existingErrors, "PKEncrypt error: input data and key must be different objects", [this.task.id], []);
      }
      if (!this.isKeyObjectOfTypePKPublic()) {
        this.addUniqueErrorToErrorsList(existingErrors, "PKEncrypt error: key object must must have PKPublic stereotype", [this.task.id], [savedData.key]);
      }
    }
    if (typeof savedData.key == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "PKEncrypt error: key is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputData == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "PKEncrypt error: inputData is undefined", [this.task.id], []);
    }
  }

}