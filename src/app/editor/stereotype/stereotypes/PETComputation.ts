import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class PETComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("PETComputation", taskHandler);
  }

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.PETComputation != null) {
      return JSON.parse(this.task.PETComputation);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // inputScript
  // inputTypes
  // outputTypes
  getCurrentStereotypeSettings() {
    let inputScript = this.settingsPanelContainer.find('#PETComputation-inputScript').val();
    let inputTypes = [];
    let outputTypes = [];
    for (let inputObject of this.getTaskInputObjects()) {
      let type = $('#PETComputation-input-type-select-'+inputObject.id).val();
      inputTypes.push({id: inputObject.id, type: type});
    }
    for (let outputObject of this.getTaskOutputObjects()) {
      let type = $('#PETComputation-output-type-select-'+outputObject.id).val();
      outputTypes.push({id: outputObject.id, type: type});
    }
    return {inputScript: inputScript, inputTypes: inputTypes, outputTypes: outputTypes};
  }

  initStereotypePublicView() {
    super.initStereotypePublicView();
    this.highlightTaskInputAndOutputObjects();
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();

    this.highlightTaskInputAndOutputObjects();

    let inputScript;
    let inputObjects = "";
    let outputObjects = "";
    let selected = null;
    let inputTypes = null;
    let outputTypes = null;

    if (this.getSavedStereotypeSettings() != null) {
      selected = this.getSavedStereotypeSettings();
      inputScript = selected.inputScript;
      if (selected.inputTypes) {
        inputTypes = selected.inputTypes
      }
      if (selected.outputTypes) {
        outputTypes = selected.outputTypes
      }
    }

    let stereotypeLink1 = $(document).find('#data-processing-privacy-preserving-menu').find('.PETComputation-button');
    let stereotypeLink2 = $(document).find('#data-processing-privacy-adding-menu').find('.PETComputation-button');
    for (let inputObject of this.getTaskInputObjects()) {
      let selectedPublic = "";
      let selectedPrivate = "";
      if (inputTypes !== null) {
        for (let inputType of inputTypes) {
          if (inputType.id == inputObject.id) {
            if (inputType.type == "public") {
              selectedPublic = "selected";
            }
            if (inputType.type == "private") {
              selectedPrivate = "selected";
            }
          }
        }
      } else {
        if (stereotypeLink1.hasClass('selected')) {
          selectedPrivate = "selected";
        } else if (stereotypeLink2.hasClass('public')) {
          selectedPublic = "selected";
        }
      }
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
      inputObjects += '<select class="form-control stereotype-option" id="PETComputation-input-type-select-'+inputObject.id+'">';
      inputObjects += '<option ' + selectedPublic + ' value="public">Public</option>';
      inputObjects += '<option ' + selectedPrivate + ' value="private">Private</option>';
      inputObjects += '</select>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      let selectedPublic = "";
      let selectedPrivate = "";
      if (outputTypes !== null) {
        for (let outputType of outputTypes) {
          if (outputType.id == outputObject.id) {
            if (outputType.type == "public") {
              selectedPublic = "selected";
            }
            if (outputType.type == "private") {
              selectedPrivate = "selected";
            }
          }
        }
      } else {
        if (stereotypeLink1.hasClass('selected')) {
          selectedPrivate = "selected";
        } else if (stereotypeLink2.hasClass('public')) {
          selectedPublic = "selected";
        }
      }
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
      outputObjects += '<select class="form-control stereotype-option" id="PETComputation-output-type-select-'+outputObject.id+'">';
      outputObjects += '<option ' + selectedPublic + ' value="public">Public</option>';
      outputObjects += '<option ' + selectedPrivate + ' value="private">Private</option>';
      outputObjects += '</select>';
    }

    this.settingsPanelContainer.find('#PETComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#PETComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#PETComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.removeTaskInputsOutputsHighlights();
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.task.PETComputation = JSON.stringify(this.getCurrentStereotypeSettings());
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#PETComputation-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#PETComputation-conditions-help').show();
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
    // Inputs: if encrypted - private, if public - public
    // Outputs: private
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      let encryptedInputIds = this.getTaskPrivateInputs().map(a => a.id);
      if (encryptedInputIds.indexOf(dataObjectId) !== -1) {
        statuses.push("private-i");
      } else if (encryptedInputIds.indexOf(dataObjectId) === -1) {
        statuses.push("public-i");
      }
    }
    if (outputIds.indexOf(dataObjectId) !== -1) {
      let encryptedOutputIds = this.getTaskPrivateOutputs().map(a => a.id);
      if (encryptedOutputIds.indexOf(dataObjectId) !== -1) {
        statuses.push("private-o");
      } else if (encryptedOutputIds.indexOf(dataObjectId) === -1) {
        statuses.push("public-o");
      }
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

  areInputsFromTaskWithStereotypeAccepted(taskId: String) {
    // Accepted:
    // ProtectConfidentiality
    // PETComputation
    if (taskId) {
      let task = this.registry.get(taskId).businessObject;
      if (task) {
        if (this.taskHasStereotype(task, "ProtectConfidentiality") || this.taskHasStereotype(task, "PETComputation")) {
          return true;
        }
      }
    }
    return false;
  }

  getTaskPrivateInputs() {
    let privateInputObjects = [];
    let inputObjects = this.getTaskInputObjects();
    let savedData = this.getSavedStereotypeSettings();
    if (savedData.inputTypes && inputObjects.length > 0) {
      for (let inputObject of inputObjects) {
        let matchingInputs = savedData.inputTypes.filter(function( obj ) {
          return obj.id === inputObject.id;
        });
        if (matchingInputs.length === 1) {
          if (matchingInputs[0].type == "private") {
            privateInputObjects.push(inputObject);
          }
        }
      }
    }
    return privateInputObjects;
  }

  getTaskPrivateOutputs() {
    let privateOutputObjects = [];
    let outputObjects = this.getTaskOutputObjects();
    let savedData = this.getSavedStereotypeSettings();
    if (savedData.outputTypes && outputObjects.length > 0) {
      for (let outputObject of outputObjects) {
        let matchingOutputs = savedData.outputTypes.filter(function( obj ) {
          return obj.id === outputObject.id;
        });
        if (matchingOutputs.length === 1) {
          if (matchingOutputs[0].type == "private") {
            privateOutputObjects.push(outputObject);
          }
        }
      }
    }
    return privateOutputObjects;
  }

  getTypeOfInput(inputId: String, taskId: String) {
    for (let incTask of this.getTaskHandlerByTaskId(taskId).getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(inputId)]) && this.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName("PETComputation").areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let incTaskOutputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskOutputObjects().map(a => a.businessObject.name.trim());
        let outputType = null;
        if (this.taskHasStereotype(this.registry.get(incTask).businessObject, "PETComputation")) {
          outputType = JSON.parse(this.registry.get(incTask).businessObject.PETComputation).outputTypes[0].type;
        }
        if (this.taskHasStereotype(this.registry.get(incTask).businessObject, "ProtectConfidentiality")) {
          outputType = "private";
        }
        if (outputType && incTaskOutputElementsNames.indexOf(this.registry.get(inputId).businessObject.name.trim()) !== -1) {
          return outputType;
        }
      }
    }
    return null;
  }

  getTypesFromIncomingPathOfTask(taskId: String) {
    let types = [];
    for (let privateInput of this.getTaskPrivateInputs()) {
      types.push({inputId: privateInput.id, type: this.getTypeOfInput(privateInput.id, taskId)});
    }
    return types;
  }

  getTypesOfAllTaskPrivateInputs() {
    return this.getTypesFromIncomingPathOfTask(this.task.id);
  }

  areAllPrivateInputsReallyPrivate() {
    let inputTypes = this.getTypesOfAllTaskPrivateInputs();
    if (inputTypes) {
      for (let inputType of inputTypes) {
        if (!inputType.type || inputType.type != "private") {
          return false;
        }
      }
    }
    return true;
  }

  getPrivateInputsThatAreNotActuallyPrivate() {
    let inputTypes = this.getTypesOfAllTaskPrivateInputs();
    let inputs = [];
    if (inputTypes) {
      for (let inputType of inputTypes) {
        if (!inputType.type || inputType.type != "private") {
          inputs.push(inputType.inputId);
        }
      }
    }
    return inputs;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    let savedData = this.getSavedStereotypeSettings();
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "PETComputation error: at least 1 input and exactly 1 output are required", [this.task.id], []);
    } else {
      if (!this.areAllPrivateInputsReallyPrivate()) {
        this.addUniqueErrorToErrorsList(existingErrors, "PETComputation error: all inputs marked as private are not private", [this.task.id], this.getPrivateInputsThatAreNotActuallyPrivate());
      }
    }
    if (typeof savedData.inputScript == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "PETComputation error: inputScript is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputTypes == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "PETComputation error: input types are undefined", [this.task.id], []);
    }
    if (typeof savedData.outputTypes == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "PETComputation error: output type is undefined", [this.task.id], []);
    }
  }

}