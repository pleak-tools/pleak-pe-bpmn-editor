import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare function require(name:string);
declare var $: any;
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

    var dataValues;
    var projectionMatrixValues;
    var outputObject = "";
    var selected = null;

    if (this.task.DimensionalityReduction != null) {
      selected = JSON.parse(this.task.DimensionalityReduction);
    }

    for (let inputObject of this.getTaskInputObjects()) {
      var selectedData = "";
      var selectedProjectionMatrix = "";
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
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (numberOfInputs == 2 && numberOfOutputs == 1) {
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

}