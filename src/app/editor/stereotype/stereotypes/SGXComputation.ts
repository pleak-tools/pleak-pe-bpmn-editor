import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";
import { SGXProtect } from "./SGXProtect";
import { SGXAttestationEnclave } from "./SGXAttestationEnclave";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SGXComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXComputation", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  SGXComputationGroupsTasks: TaskStereotypeGroupObject[] = [];

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getGroup() {
    return this.group;
  }

  setGroup(name: String) {
    this.group = name;
  }

  initStereotypePublicView() {
    this.init();
    this.loadAllSGXComputationGroupsTasks();
    super.initStereotypePublicView();
    this.highlightSGXComputationGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();
    this.initInputScriptSelectLinks();

    let selectedGroupId = null;
    let groups;
    let inputObjects = "";
    let outputObjects = "";
    let inputScript;
    let inputTypes = null;
    let outputTypes = null;
    let selected = null;

    this.loadAllSGXComputationGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelSGXComputationGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its inputs and outputs would be highlighted
        this.SGXComputationGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.task.SGXComputation != null) {
      selectedGroupId = this.getGroup();
      selected = JSON.parse(this.task.SGXComputation);
      if (selected.inputTypes) {
        inputTypes = selected.inputTypes;
      }
      if (selected.outputTypes) {
        outputTypes = selected.outputTypes;
      }
      if (selected.inputScript) {
        inputScript = selected.inputScript;
      }
    } else {
      if (this.SGXComputationGroupsTasks.length > 0) {
        selectedGroupId = this.SGXComputationGroupsTasks[0].groupId;
      }
    }

    if (inputScript && inputScript.type && inputScript.type == "script") {
      this.settingsPanelContainer.find('#SGXComputation-inputScript').val(inputScript.contents);
      this.settingsPanelContainer.find('#SGXComputation-inputScriptType-stereotype').removeClass('link-selected').addClass('link-not-selected');
      this.settingsPanelContainer.find('#SGXComputation-inputScriptType-script').removeClass('link-not-selected').addClass('link-selected');
      this.settingsPanelContainer.find('#SGXComputation-scriptInput').show();
      this.settingsPanelContainer.find('#SGXComputation-stereotypeInput').hide();

    } else if (inputScript && inputScript.type && inputScript.type == "stereotype") {
      this.settingsPanelContainer.find('#SGXComputation-inputStereotypeSelect').val(inputScript.contents);
      this.settingsPanelContainer.find('#SGXComputation-inputScriptType-script').removeClass('link-selected').addClass('link-not-selected');
      this.settingsPanelContainer.find('#SGXComputation-inputScriptType-stereotype').removeClass('link-not-selected').addClass('link-selected');
      this.settingsPanelContainer.find('#SGXComputation-stereotypeInput').show();
      this.settingsPanelContainer.find('#SGXComputation-scriptInput').hide();
    } else {
      this.settingsPanelContainer.find('#SGXComputation-inputScriptType-stereotype').removeClass('link-selected').addClass('link-not-selected');
      this.settingsPanelContainer.find('#SGXComputation-inputScriptType-script').removeClass('link-not-selected').addClass('link-selected');
      this.settingsPanelContainer.find('#SGXComputation-scriptInput').show();
      this.settingsPanelContainer.find('#SGXComputation-stereotypeInput').hide();
    }

    let stObjects = "";
    for (let stereotype of this.getAllTaskStereotypeInstances()) {
      if (stereotype.getTitle() !== this.getTitle()) {
        let sel = "";
        if (inputScript && inputScript.type && inputScript.type == "stereotype" && inputScript.contents == stereotype.getTitle()) {
          sel = "selected";
        }
        stObjects += '<option value="' + stereotype.getTitle() + '" ' + sel + '>' + stereotype.getTitle() + '</option>';
      }
    }

    this.highlightSGXComputationGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelSGXComputationGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelSGXComputationGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

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
          selectedPrivate = "selected";
        }
        inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
        inputObjects += '<select class="form-control stereotype-option" id="SGXComputation-input-type-select-'+inputObject.id+'">';
        inputObjects += '<option ' + selectedPublic + ' value="public">Public</option>';
        inputObjects += '<option ' + selectedPrivate + ' value="private">SGXPrivate</option>';
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
          selectedPrivate = "selected";
        }
        outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
        outputObjects += '<select class="form-control stereotype-option" id="SGXComputation-output-type-select-'+outputObject.id+'">';
        outputObjects += '<option ' + selectedPublic + ' value="public">Public</option>';
        outputObjects += '<option ' + selectedPrivate + ' value="private">SGXPrivate</option>';
        outputObjects += '</select>';
      }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of this.getSGXComputationGroupTasks(selectedGroupId)) {
        if (groupTask.id != this.task.id) {
          let taskName = undefined;
          if (groupTask.businessObject.name) {
            taskName = groupTask.businessObject.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
          taskObjs += '<label class="text-16">' + taskName + '</label>'
          taskObjs += '<ul class="stereotype-option">';

          let taskInputs = '<label class="text-16">Input data objects</label>';
          let taskOutputs = '<label class="text-16">Output data</label>';

          let inputObjects = this.getTaskHandlerByTaskId(groupTask.id).getTaskInputObjects();
          let outputObjects = this.getTaskHandlerByTaskId(groupTask.id).getTaskOutputObjects()

          for (let inputObj of inputObjects) {
            taskInputs += '<li>' + inputObj.businessObject.name + '</li>';
          }

          if (outputObjects.length > 0) {
            for (let outputObj of outputObjects) {
              taskOutputs += '<li>' + outputObj.businessObject.name + '</li>';
            }
            taskObjs += taskOutputs;
          }

          taskObjs += taskInputs;
          taskObjs += '</ul>';

        }
      }
    }

    this.settingsPanelContainer.find('#SGXComputation-taskName').text(this.task.name);
    this.settingsPanelContainer.find('#SGXComputation-groupSelect').html(groups);
    this.settingsPanelContainer.find('#SGXComputation-inputStereotypeSelect').html('');
    this.settingsPanelContainer.find('#SGXComputation-inputStereotypeSelect').html(stObjects);
    this.settingsPanelContainer.find('#SGXComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SGXComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#SGXComputation-newGroup').html('');
    this.settingsPanelContainer.find('#SGXComputation-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.terminateInputScriptSelectLinks();
    this.removeAllSGXComputationGroupsAndTheirInputsOutputsHighlights();
    this.SGXComputationGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#SGXComputation-groupSelect').val();
    let inputScriptType = "";
    let inputScriptContents = "";
    let inputScript;
    if (this.settingsPanelContainer.find('#SGXComputation-inputScriptType-script').is('.link-selected')) {
      inputScriptType = "script";
      inputScriptContents = this.settingsPanelContainer.find('#SGXComputation-inputScript').val();
    } else if (this.settingsPanelContainer.find('#SGXComputation-inputScriptType-stereotype').is('.link-selected')) {
      inputScriptType = "stereotype";
      inputScriptContents = this.settingsPanelContainer.find('#SGXComputation-inputStereotypeSelect').val();
    }
    inputScript = {type: inputScriptType, contents: inputScriptContents};
    if (group) {
      if (this.areInputsAndOutputsNumbersCorrect()) {
        let inputTypes = [];
        let outputTypes = [];
        let flag = false;
        for (let inputObject of this.getTaskInputObjects()) {
          let type = $('#SGXComputation-input-type-select-'+inputObject.id).val();
          if (type == "private") {
            flag = true;
          }
          inputTypes.push({id: inputObject.id, type: type});
        }
        if (!flag) {
          this.settingsPanelContainer.find('#SGXComputation-inputObjects-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#SGXComputation-inputObjects-help').show();
          this.initSaveAndRemoveButtons();
          return;
        }
        for (let outputObject of this.getTaskOutputObjects()) {
          let type = $('#SGXComputation-output-type-select-'+outputObject.id).val();
          outputTypes.push({id: outputObject.id, type: type});
        }
        if (this.task.SGXComputation == null) {
          this.addStereotypeToElement();
        }
        this.setGroup(group);
        this.SGXComputationGroupsTasks = $.grep(this.SGXComputationGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
        this.SGXComputationGroupsTasks.push({groupId: group, taskId: this.task.id});
        for (let task of this.getSGXComputationGroupTasks(group)) {
          if (task.id == this.task.id) {
            task.businessObject.SGXComputation = JSON.stringify({groupId: group, inputScript: inputScript, inputTypes: inputTypes, outputTypes: outputTypes});
          }
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        super.saveStereotypeSettings();
      } else {
        this.settingsPanelContainer.find('#SGXComputation-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXComputation-conditions-help').show();
        this.initSaveAndRemoveButtons();
      }
    } else {
      this.settingsPanelContainer.find('#SGXComputation-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXComputation-groupSelect-help').show();
    }
  }

  removeStereotype() {
    super.removeStereotype();
  }

  /** SGXComputation class specific functions */
  init() {
    if (this.task.SGXComputation != null) {
      this.setGroup(JSON.parse(this.task.SGXComputation).groupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllSGXComputationGroupsTasks() {
    this.SGXComputationGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "SGXComputation" && (<SGXComputation>stereotype).getGroup() != null) {
          this.SGXComputationGroupsTasks.push({groupId: (<SGXComputation>stereotype).getGroup(), taskId: stereotype.task.id});
        }
        if (stereotype.getTitle() == "SGXProtect" && (<SGXProtect>stereotype).getGroup() != null) {
          this.SGXComputationGroupsTasks.push({groupId: (<SGXProtect>stereotype).getGroup(), taskId: stereotype.task.id});
        }
        if (stereotype.getTitle() == "SGXAttestationEnclave" && (<SGXAttestationEnclave>stereotype).getSGXGroup() != null && (<SGXAttestationEnclave>stereotype).getSGXGroup() != "") {
          this.SGXComputationGroupsTasks.push({groupId: (<SGXAttestationEnclave>stereotype).getSGXGroup(), taskId: stereotype.task.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#SGXComputation-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#SGXComputation-newGroup').val();
      this.addSGXComputationGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#SGXComputation-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#SGXComputation-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });
  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#SGXComputation-groupSelect');
  }

  initInputScriptSelectLinks() {
    this.settingsPanelContainer.on('click', '#SGXComputation-inputScriptType-script', (e) => {
      if (!$(e.target).is('.link-selected')) {
        this.settingsPanelContainer.find('#SGXComputation-inputScriptType-stereotype').toggleClass('link-selected link-not-selected');
        $(e.target).toggleClass('link-selected link-not-selected');
        this.settingsPanelContainer.find('#SGXComputation-scriptInput').show();
        this.settingsPanelContainer.find('#SGXComputation-stereotypeInput').hide();
      }
    });
    this.settingsPanelContainer.on('click', '#SGXComputation-inputScriptType-stereotype', (e) => {
      if (!$(e.target).is('.link-selected')) {
        this.settingsPanelContainer.find('#SGXComputation-inputScriptType-script').toggleClass('link-selected link-not-selected');
        $(e.target).toggleClass('link-selected link-not-selected');
        this.settingsPanelContainer.find('#SGXComputation-stereotypeInput').show();
        this.settingsPanelContainer.find('#SGXComputation-scriptInput').hide();
      }
    });
  }

  terminateInputScriptSelectLinks() {
    this.settingsPanelContainer.off('click', '#SGXComputation-inputScriptType-script');
    this.settingsPanelContainer.off('click', '#SGXComputation-inputScriptType-stereotype');
  }

  addSGXComputationGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#SGXComputation-newGroup').val('');
      this.settingsPanelContainer.find('#SGXComputation-inputScript').val('');
      this.settingsPanelContainer.find('#SGXComputation-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#SGXComputation-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXComputation-newGroup-help').show();
    }
  }

  reloadStereotypeSettingsWithSelectedGroup(group: String) {
    // Create temporary object to save current stereotype group
    let tmpObj = {groupId: this.getGroup()};
    let currentGroupObj = $.extend({}, tmpObj);

    // Terminate current task stereotype settings
    this.terminateStereotypeSettings();

    // Set selected group temporarily to new selected group to init stereotype settings based on new group
    this.selectedGroup = group;

    if (currentGroupObj.groupId != null) {
      this.initAllElementStereotypesSettings();
    } else {
      this.initAllElementStereotypesSettings();
      this.initStereotypeSettings();
    }

    // Set selected group back to null (in case new group is not going to be saved)
    this.selectedGroup = null;
  }

  highlightSGXComputationGroupMembersAndTheirInputsOutputs(group: String) {

    for (let i = 0; i < this.SGXComputationGroupsTasks.length; i++) {
      let groupId = this.SGXComputationGroupsTasks[i].groupId;
      let taskId = this.SGXComputationGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getSGXComputationGroupInputOutputObjects(groupId);

        for (let inputOutputObj of groupInputsOutputs) {
          if (this.getTaskInputObjects().indexOf(inputOutputObj) !== -1 || this.getTaskOutputObjects().indexOf(inputOutputObj) !== -1) {
            this.canvas.addMarker(inputOutputObj.id, 'highlight-input-output-selected');
          } else {
            this.canvas.addMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }

        for (let inputObject of this.getTaskInputObjectsByTaskId(taskId)) {
          if (groupInputsOutputs.indexOf(inputObject) === -1) {
            if (taskId == this.task.id) {
              this.canvas.addMarker(inputObject.id, 'highlight-input-selected');
            } else {
              this.canvas.addMarker(inputObject.id, 'highlight-input');
            }
          }
        }

        for (let outputObj of this.getTaskOutputObjectsByTaskId(taskId)) {
          if (groupInputsOutputs.indexOf(outputObj) === -1) {
            if (taskId == this.task.id) {
              this.canvas.addMarker(outputObj.id, 'highlight-output-selected');
            } else {
              this.canvas.addMarker(outputObj.id, 'highlight-output');
            }
          }
        }

      }

    }

  }

  removeAllSGXComputationGroupsAndTheirInputsOutputsHighlights() {
    if (this.SGXComputationGroupsTasks) {
      for (let i = 0; i < this.SGXComputationGroupsTasks.length; i++) {
        let taskId = this.SGXComputationGroupsTasks[i].taskId;
        this.canvas.removeMarker(taskId, 'highlight-group');
        if (this.task.id != null) {
          for (let inputObj of this.getTaskInputObjectsByTaskId(taskId)) {
            this.canvas.removeMarker(inputObj.id, 'highlight-input');
            this.canvas.removeMarker(inputObj.id, 'highlight-input-selected');
          }
          for (let outputObj of this.getTaskOutputObjectsByTaskId(taskId)) {
            this.canvas.removeMarker(outputObj.id, 'highlight-output');
            this.canvas.removeMarker(outputObj.id, 'highlight-output-selected');
          }
          for (let inputOutputObj of this.getSGXComputationGroupInputOutputObjects(this.SGXComputationGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelSGXComputationGroups() {
    let difGroups = [];
    for (let i = 0; i < this.SGXComputationGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.SGXComputationGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.SGXComputationGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getSGXComputationGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.SGXComputationGroupsTasks, function(el, idx) {return el.groupId.trim() == group.trim()}, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getSGXComputationGroupInputOutputObjects(group: String) {
    let objects = [];
    if (this.SGXComputationGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getSGXComputationGroupTasks(group)) {
        for (let inputObj of this.getTaskInputObjectsByTaskId(task.id)) {
          allInputsOutputs.push(inputObj);
          allInputs.push(inputObj);
        }
         for (let outputObj of this.getTaskOutputObjectsByTaskId(task.id)) {
          allInputsOutputs.push(outputObj);
          allOutputs.push(outputObj);
        }
      }
      for (let obj of allInputsOutputs) {
        if (allInputs.indexOf(obj) !== -1 && allOutputs.indexOf(obj) !== -1 && objects.indexOf(obj) === -1) {
           objects.push(obj);
        }
      }
    }
    return objects;
  }

  getNumberOfSGXComputationGroupInputs() {
    let groupTasks = this.getSGXComputationGroupTasks(this.getGroup());
    let numberOfgroupInputs = 0;
    for (let task of groupTasks) {
      let numberOfTaskInputs = this.getTaskInputObjectsByTaskId(task.id).length;
      numberOfgroupInputs += numberOfTaskInputs;
    }
    return numberOfgroupInputs;
  }

  getNumberOfSGXComputationGroupOutputs() {
    let groupTasks = this.getSGXComputationGroupTasks(this.getGroup());
    let numberOfGroupOutputs = 0;
    for (let task of groupTasks) {
      let numberOfTaskOutputs = this.getTaskOutputObjectsByTaskId(task.id).length;
      numberOfGroupOutputs += numberOfTaskOutputs;
    }
    return numberOfGroupOutputs;
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: if SGXPrivate - private, if public - public
    // Outputs: if SGXPrivate - private, if public - public
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
      let savedData = JSON.parse(this.task.SGXComputation);
      if (savedData.inputScript.type == "stereotype" && savedData.inputScript.contents) {
        if (this.taskHasStereotype(this.task, savedData.inputScript.contents) && (savedData.inputScript.contents == "PKEncrypt" || savedData.inputScript.contents == "SKEncrypt" || savedData.inputScript.contents == "SGXProtect")) {
          return this.getTaskHandlerByTaskId(this.task.id).getTaskStereotypeInstanceByName(savedData.inputScript.contents).getDataObjectVisibilityStatus(dataObjectId);
        }
      }
      let outputType = JSON.parse(this.task.SGXComputation).outputTypes[0].type;
      if (outputType == "private") {
        statuses.push("private-o");
      } else if (outputType == "public") {
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
    if (numberOfInputs <1 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areInputsFromTaskWithStereotypeAccepted(taskId: String) {
    // Accepted:
    // SGXComputation
    // SGXProtect
    if (taskId) {
      let task = this.registry.get(taskId).businessObject;
      if (task) {
        if (this.taskHasStereotype(task, "SGXComputation") && JSON.parse(task.SGXComputation).groupId.trim() == this.getGroup().trim()) {
          return true;
        } else if (this.taskHasStereotype(task, "SGXProtect") && JSON.parse(task.SGXProtect).groupId.trim() == this.getGroup().trim()) {
          return true;
        }
      }
    }
    return false;
  }

  isThereAtLeastOnePrivateInput() {
    let savedData = JSON.parse(this.task.SGXComputation);
    if (savedData.inputTypes) {
      for (let inputType of savedData.inputTypes) {
        if (inputType.type == "private") {
          return true;
        }
      }
    }
    return false;
  }

  getTaskPrivateInputs() {
    let privateInputObjects = [];
    let inputObjects = this.getTaskInputObjects();
    let savedData = JSON.parse(this.task.SGXComputation);
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

  getTypeOfInput(inputId: String, taskId: String) {
    for (let incTask of this.getTaskHandlerByTaskId(taskId).getTasksOfIncomingPath()) {
      if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(inputId)]) && this.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName("SGXComputation").areInputsFromTaskWithStereotypeAccepted(incTask)) {
        let incTaskOutputElementsNames = this.getTaskHandlerByTaskId(incTask).getTaskOutputObjects().map(a => a.businessObject.name.trim());
        let outputType = null;
        if (this.taskHasStereotype(this.registry.get(incTask).businessObject, "SGXComputation")) {
          outputType = JSON.parse(this.registry.get(incTask).businessObject.SGXComputation).outputTypes[0].type;
        }
        if (this.taskHasStereotype(this.registry.get(incTask).businessObject, "SGXProtect")) {
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

  areGroupTasksOnTheSameLane() {
    let groupTasks = this.getSGXComputationGroupTasks(this.getGroup());
    for (let task of groupTasks) {
      for (let task2 of groupTasks) {
        if (task.id !== task2.id && !this.taskHasStereotype(task.businessObject, "SGXProtect") && !this.taskHasStereotype(task2.businessObject, "SGXProtect")) {
          // If some or all of group tasks have same parent, return false
          if (task.parent.id !== task2.parent.id) {
            return false;
          } else {
            if (task.businessObject.lanes && task2.businessObject.lanes && task.businessObject.lanes[0].id != task2.businessObject.lanes[0].id) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllSGXComputationGroupsTasks();

    let groupTasks = this.getSGXComputationGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = JSON.parse(this.task.SGXComputation);
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXComputation error: at least 1 input and exactly 1 output are required", [this.task.id], []);
    } else {
      if (!this.isThereAtLeastOnePrivateInput()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SGXComputation error: at least 1 input must be selected as SGXPrivate", [this.task.id], []);
      }
      if (!this.areGroupTasksOnTheSameLane()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SGXComputation error: all group tasks must be on the same lane", groupTasksIds, []);
      } else {
        if (!this.areAllPrivateInputsReallyPrivate()) {
          this.addUniqueErrorToErrorsList(existingErrors, "SGXComputation error: all inputs marked as SGXPrivate are not SGXPrivate", [this.task.id], this.getPrivateInputsThatAreNotActuallyPrivate());
        }
      }
    }
    if (savedData.inputScript.type == "stereotype" && !this.taskHasStereotype(this.task, savedData.inputScript.contents)) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXComputation error: inputScript stereotype is missing", [this.task.id], []);
    }
    if (typeof savedData.inputScript == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXComputation error: inputScript is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputTypes == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXComputation error: input types are undefined", [this.task.id], []);
    }
    if (typeof savedData.outputTypes == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXComputation error: outputType is undefined", [this.task.id], []);
    }
  }

}