import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class DimensionalityReduction extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("DimensionalityReduction", taskHandler);
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

    let dataValues;
    let projectionMatrixValues;
    let outputObject = "";
    let selected = null;

    if (this.task.DimensionalityReduction != null) {
      selected = JSON.parse(this.task.DimensionalityReduction);
    }

    for (let inputObject of this.getTaskInputObjects()) {
      let selectedData = "";
      let selectedProjectionMatrix = "";
      if (selected !== null) {
        if (inputObject.id == selected.data) {
          selectedData = "selected";
        }
        if (inputObject.id == selected.projectionMatrix) {
          selectedProjectionMatrix = "selected";
        }
      }
      dataValues += '<option ' + selectedData + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      projectionMatrixValues += '<option ' + selectedProjectionMatrix + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    this.settingsPanelContainer.find('#DimensionalityReduction-dataSelect').html(dataValues);
    this.settingsPanelContainer.find('#DimensionalityReduction-projectionMatrixSelect').html(projectionMatrixValues);
    this.settingsPanelContainer.find('#DimensionalityReduction-outputObject').html(outputObject);
    this.settingsPanelContainer.show();

  }

  terminateStereotypeSettings() {
    this.removeTaskInputsOutputsHighlights();
    super.terminateStereotypeSettings();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let data = this.settingsPanelContainer.find('#DimensionalityReduction-dataSelect').val();
      let projectionMatrix = this.settingsPanelContainer.find('#DimensionalityReduction-projectionMatrixSelect').val();
      if (data == projectionMatrix) {
        this.settingsPanelContainer.find('#DimensionalityReduction-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#DimensionalityReduction-data-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#DimensionalityReduction-projectionMatrix-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#DimensionalityReduction-conditions-help2').show();
        this.initSaveAndRemoveButtons();
        return;
      }
      if (this.task.DimensionalityReduction == null) {
        this.addStereotypeToElement();
      }
      this.task.DimensionalityReduction = JSON.stringify({data: data, projectionMatrix: projectionMatrix});
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#DimensionalityReduction-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#DimensionalityReduction-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }
  
  removeStereotype() {
    super.removeStereotype();
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: public
    // Outputs: public
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1 || outputIds.indexOf(dataObjectId) !== -1) {
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

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = JSON.parse(this.task.DimensionalityReduction);
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "DimensionalityReduction error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.data)) {
      this.addUniqueErrorToErrorsList(existingErrors, "DimensionalityReduction error: data object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.projectionMatrix)) {
      this.addUniqueErrorToErrorsList(existingErrors, "DimensionalityReduction error: projectionMatrix object is missing", [this.task.id], []);
    } else {
      if (savedData.data == savedData.projectionMatrix) {
        this.addUniqueErrorToErrorsList(existingErrors, "DimensionalityReduction error: data and projectionMatrix must be different objects", [this.task.id], []);
      }
    }
    if (typeof savedData.data == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "DimensionalityReduction error: data is undefined", [this.task.id], []);
    }
    if (typeof savedData.projectionMatrix == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "DimensionalityReduction error: projectionMatrix is undefined", [this.task.id], []);
    }
  }

}