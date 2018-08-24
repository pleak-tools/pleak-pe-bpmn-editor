import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SSComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SSComputation", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  SSComputationGroupsTasks: TaskStereotypeGroupObject[] = [];

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
    this.loadAllSSComputationGroupsTasks();
    super.initStereotypePublicView();
    this.highlightSSComputationGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    let selectedGroupId = null;
    let groups;
    let inputObjects = "";
    let outputObjects = "";
    let inputScript;

    this.loadAllSSComputationGroupsTasks();

    let SSComputationGroups = this.getModelSSComputationGroups();

    if (this.selectedGroup != null) {
      if (SSComputationGroups.indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its inputs and outputs would be highlighted
        this.SSComputationGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.task.SSComputation != null) {
      selectedGroupId = this.getGroup();
    } else {
      if (this.SSComputationGroupsTasks.length > 0) {
        selectedGroupId = this.SSComputationGroupsTasks[0].groupId;
      }
    }

    let groupTasks = null;
    if (selectedGroupId !== null) {
      groupTasks = this.getSSComputationGroupTasks(selectedGroupId);
    }

    inputScript = this.getSSComputationGroupInputScript(selectedGroupId);
    this.highlightSSComputationGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of SSComputationGroups) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (SSComputationGroups.indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    let taskInputs = this.getTaskInputObjects();

    if (this.getSSComputationGroupInputs(selectedGroupId) && this.getSSComputationGroupInputs(selectedGroupId).length > 0 && groupTasks && groupTasks.length >= 1) {
      let groupInputs = this.getSSComputationGroupInputs(selectedGroupId);
      let taskInputNamesStr = this.getTaskInputObjects().map(a => a.businessObject.name.trim()).sort().toString();
      let groupInputNames = [];
      for (let input of groupInputs) {
        for (let inp of input.inputs) {
          groupInputNames.push(inp);
        }
      }
      let groupInputNamesStr = groupInputNames.map(a => a.name.trim()).sort().toString();

      if (groupInputNamesStr != taskInputNamesStr) {
        for (let groupInput of groupInputs) {
          let groupInputInputs = groupInput.inputs;
          let inputNames = groupInput.inputs;
          let inputSel = '';
          for (let taskInput of taskInputs) {
            inputNames = inputNames.filter(function( obj ) {
              return obj.id !== taskInput.id;
            });
            let selected = "";
            for (let input of groupInputInputs) {
              if (input.id == taskInput.id) {
                selected = "selected";
              }
            }
            inputSel += '<option ' + selected + ' value="' + taskInput.id + '">' + taskInput.businessObject.name + '</option>';
          }
          inputObjects += inputNames.map(a => a.name).sort().toString() + ': ' + '<select class="form-control stereotype-option" id="SSComputation-inputSelect-' + groupInput.id +'">' + inputSel + '</select>';
        }
        this.settingsPanelContainer.find('#SSComputation-inputObjects-title').text("Choose corresponding inputs");
      } else {
        for (let inputObject of taskInputs) {
          inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
        }
        this.settingsPanelContainer.find('#SSComputation-inputObjects-title').text("Input data objects");
      }
    } else {
      for (let inputObject of taskInputs) {
        inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
      }
      this.settingsPanelContainer.find('#SSComputation-inputObjects-title').text("Input data objects");
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of this.getSSComputationGroupTasks(selectedGroupId)) {
        if (groupTask.id != this.task.id) {
          let taskName = undefined;
          if (groupTask.businessObject.name) {
            taskName = groupTask.businessObject.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
          taskObjs += '<label class="text-16">' + taskName + '</label>'
          taskObjs += '<ul class="stereotype-option">';

          let taskInputs = '<label class="text-16">Input data objects</label>';
          let taskOutputs = '<label class="text-16">Output data</label>';

          for (let inputObj of this.getTaskHandlerByTaskId(groupTask.id).getTaskInputObjects()) {
            taskInputs += '<li>' + inputObj.businessObject.name + '</li>';
          }
          for (let outputObj of this.getTaskHandlerByTaskId(groupTask.id).getTaskOutputObjects()) {
            taskOutputs += '<li>' + outputObj.businessObject.name + '</li>';
          }

          taskObjs += taskInputs;
          taskObjs += taskOutputs;
          taskObjs += '</ul>';

        }
      }
    }
  
    this.settingsPanelContainer.find('#SSComputation-taskName').text(this.task.name);
    this.settingsPanelContainer.find('#SSComputation-groupSelect').html(groups);
    this.settingsPanelContainer.find('#SSComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#SSComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SSComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#SSComputation-newGroup').html('');
    this.settingsPanelContainer.find('#SSComputation-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllSSComputationGroupsAndTheirInputsOutputsHighlights();
    this.SSComputationGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#SSComputation-groupSelect').val();
    let inputScript = this.settingsPanelContainer.find('#SSComputation-inputScript').val();
    if (this.areInputsAndOutputsNumbersCorrect()) {
      if (group) {
        this.setGroup(group);
        this.SSComputationGroupsTasks = $.grep(this.SSComputationGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
        this.SSComputationGroupsTasks.push({groupId: group, taskId: this.task.id});
        let inputObjects = this.getTaskInputObjects();
        let inputs = [];
        if (this.getSSComputationGroupTasks(group).length <= 1) {
          for (let i = 0; i < inputObjects.length; i++) {
            inputs.push({id: i, inputs: [{id: inputObjects[i].id, name: inputObjects[i].businessObject.name}]});
          }
        } else {
          let savedInputs = this.getSSComputationGroupInputs(group);
          let taskInputs = this.getTaskInputObjects();
          for (let sInput of savedInputs) {
            let selectedInput = $('#SSComputation-inputSelect-'+sInput.id).val();
            if (this.taskHasInputElement(selectedInput)) {
              let newInputId = sInput.id;
              let newInputInputs = sInput.inputs;
              for (let tInput of taskInputs) {
                newInputInputs = newInputInputs.filter(function( obj ) {
                  return obj.id !== tInput.id;
                });
              }
              newInputInputs.push({id: selectedInput, name: this.registry.get(selectedInput).businessObject.name})
              inputs.push({id: newInputId, inputs: newInputInputs});
            }
          }
        }
        // Check if all selected inputs are different
        if (this.getSSComputationGroupTasks(group).length > 1) {
          let savedInputs = this.getSSComputationGroupInputs(group);
          let selectedInputs = [];
          for (let sInput of savedInputs) {
            selectedInputs.push($('#SSComputation-inputSelect-'+sInput.id).val());
          }
          let hasDuplicates = selectedInputs.some(function(item, idx) {
            return selectedInputs.indexOf(item) != idx
          });
          if (hasDuplicates) {
            this.settingsPanelContainer.find('#SSComputation-inputs-form-group').addClass('has-error');
            this.settingsPanelContainer.find('#SSComputation-inputs-help').show();
            this.initSaveAndRemoveButtons();
            return;
          }
        }
        if (this.task.SSComputation == null) {
          this.addStereotypeToElement();
        }
        for (let task of this.getSSComputationGroupTasks(group)) {
          task.businessObject.SSComputation = JSON.stringify({groupId: group, inputScript: inputScript, inputs: inputs});
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        super.saveStereotypeSettings();
      } else {
        this.settingsPanelContainer.find('#SSComputation-groupSelect-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SSComputation-groupSelect-help').show();
      }
    } else {
      this.settingsPanelContainer.find('#SSComputation-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SSComputation-conditions-help').show();
      this.initSaveAndRemoveButtons();
    }
  }

  removeStereotype() {
    if (confirm('Are you sure you wish to remove the stereotype?')) {
      let group = this.getGroup();
      let inputScript = this.getSSComputationGroupInputScript(group);
      if (this.getSSComputationGroupTasks(group).length > 1 && JSON.parse(this.task.SSComputation).inputs) {
        let inputs = [];
        let savedInputs = this.getSSComputationGroupInputs(group);
        let taskInputs = this.getTaskInputObjects();
        for (let sInput of savedInputs) {
          let newInputId = sInput.id;
          let newInputInputs = sInput.inputs;
          for (let tInput of taskInputs) {
            newInputInputs = newInputInputs.filter(function( obj ) {
              return obj.id !== tInput.id;
            });
          }
          inputs.push({id: newInputId, inputs: newInputInputs});
        }
        for (let task of this.getSSComputationGroupTasks(group)) {
          task.businessObject.SSComputation = JSON.stringify({groupId: group, inputScript: inputScript, inputs: inputs});
          this.getTaskHandlerByTaskId(task.id).getTaskStereotypeInstanceByName("SSComputation").loadAllSSComputationGroupsTasks();
        }
      }
      this.loadAllSSComputationGroupsTasks();
      super.removeStereotype();
    } else {
      this.initSaveAndRemoveButtons();
      return false;
    }
  }

  /** SSComputation class specific functions */
  init() {
    if (this.task.SSComputation != null) {
      this.setGroup(JSON.parse(this.task.SSComputation).groupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllSSComputationGroupsTasks() {
    this.SSComputationGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "SSComputation" && (<SSComputation>stereotype).getGroup() != null) {
          this.SSComputationGroupsTasks.push({groupId: (<SSComputation>stereotype).getGroup(), taskId: stereotype.task.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#SSComputation-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#SSComputation-newGroup').val();
      this.addSSComputationGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#SSComputation-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#SSComputation-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#SSComputation-groupSelect');
  }

  addSSComputationGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#SSComputation-newGroup').val('');
      this.settingsPanelContainer.find('#SSComputation-inputScript').val('');
      this.settingsPanelContainer.find('#SSComputation-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#SSComputation-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SSComputation-newGroup-help').show();
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

  highlightSSComputationGroupMembersAndTheirInputsOutputs(group: String) {

    for (let i = 0; i < this.SSComputationGroupsTasks.length; i++) {
      let groupId = this.SSComputationGroupsTasks[i].groupId;
      let taskId = this.SSComputationGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getSSComputationGroupInputOutputObjects(groupId);

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

  removeAllSSComputationGroupsAndTheirInputsOutputsHighlights() {
    if (this.SSComputationGroupsTasks) {
      for (let i = 0; i < this.SSComputationGroupsTasks.length; i++) {
        let taskId = this.SSComputationGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getSSComputationGroupInputOutputObjects(this.SSComputationGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelSSComputationGroups() {
    let difGroups = [];
    for (let i = 0; i < this.SSComputationGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.SSComputationGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.SSComputationGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getSSComputationGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.SSComputationGroupsTasks, function(el, idx) {return el.groupId.trim() == group.trim()}, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getSSComputationGroupOutputs(group: String) {
    this.init();
    this.loadAllSSComputationGroupsTasks();
    let groupTasks = this.getSSComputationGroupTasks(group);
    let outputs = [];
    for (let task of groupTasks) {
      outputs = outputs.concat(this.getTaskOutputObjectsByTaskId(task.id));
    }
    return outputs;
  }

  getSSComputationGroupInputOutputObjects(group: String) {
    let objects = [];
    if (this.SSComputationGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getSSComputationGroupTasks(group)) {
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

  getSSComputationGroupInputScript(group: String) {
    let script = "";
    if (group != null) {
      let groupTasks = this.getSSComputationGroupTasks(group);
      if (groupTasks.length === 1) {
        if (groupTasks[0].businessObject.SSComputation) {
          script = JSON.parse(groupTasks[0].businessObject.SSComputation).inputScript;
        }
        } else {
        for (let groupTask of groupTasks) {
          if (groupTask.id != this.task.id) {
            script = JSON.parse(groupTask.businessObject.SSComputation).inputScript;
            break;
          }
        }
      }
    }
    return script;
  }

  getSSComputationGroupInputs(group: String) {
    let inputs = [];
    if (group != null) {
      let groupTasks = this.getSSComputationGroupTasks(group);
      if (groupTasks.length === 1) {
        if (groupTasks[0].businessObject.SSComputation) {
          inputs = JSON.parse(groupTasks[0].businessObject.SSComputation).inputs;
        }
        } else {
        for (let groupTask of groupTasks) {
          if (groupTask.id != this.task.id) {
            inputs = JSON.parse(groupTask.businessObject.SSComputation).inputs;
            break;
          }
        }
      }
    }
    return inputs;
  }

  getSSComputationGroupInputObjectsByShareGroupId(id: String) {
    let objects = [];
    if (this.getSSComputationGroupInputs(this.getGroup())) {
      for (let inputs of this.getSSComputationGroupInputs(this.getGroup())) {
        if (inputs.id == id) {
          for (let input of inputs.inputs) {
            objects.push(this.registry.get(input.id));
          }
        }
      }
    }
    return objects;
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: if from sharegroup with the same name - public, if from sharegroup with different names - private
    // Outputs: private
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      let allGroupInputs = this.getSSComputationGroupInputs(this.getGroup());
      if (allGroupInputs) {
        for (let inputs of allGroupInputs) {
          let sharesGroup = this.getSSComputationGroupInputObjectsByShareGroupId(inputs.id);
          if (sharesGroup.map(a => a.id).indexOf(dataObjectId) !== -1) {
            if (sharesGroup.map(a => a.businessObject.name.trim()).every( (val, i, arr) => val === arr[0] )) {
              statuses.push("public-i");
            } else if (!sharesGroup.map(a => a.businessObject.name.trim()).every( (val, i, arr) => val === arr[0] )) {
              statuses.push("private-i");
            }
          }
        }
      }
    }
    let taskOutputs = this.getTaskOutputObjects();
    if (taskOutputs.map(a => a.id).indexOf(dataObjectId)) {
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

  areInputsFromTaskWithStereotypeAccepted(taskId: String) {
    // Accepted:
    // SSSharing
    // SSComputation
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.SSSharing || task.businessObject.SSComputation) {
          return true;
        }
      }
    }
    return false;
  }

  areGroupTasksOnDifferentLanes() {
    let groupTasks = this.getSSComputationGroupTasks(this.getGroup());
    for (let task of groupTasks) {
      for (let task2 of groupTasks) {
        if (task.id !== task2.id) {
          // If some or all of group tasks have same parent, return false
          if (task.parent.id === task2.parent.id) {
            if (task.businessObject.lanes && task2.businessObject.lanes && task.businessObject.lanes[0].id == task2.businessObject.lanes[0].id) {
              return false;
            }
            if (!task.businessObject.lanes || !task2.businessObject.lanes) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  areShareOfFunctionSharesFromSameOrigin() {
    let incorrectShareGroups = this.getIdsOfIncorrectSharesGroups();
    if (incorrectShareGroups.length > 0) {
      return false;
    }
    return true;
  }

  getIdsOfIncorrectSharesGroups() {
    let groupIds = [];
    let elementsIds = [];
    let currentGroupInputs = this.getSSComputationGroupInputs(this.getGroup());
    if (currentGroupInputs) {
      let correcGroupInputsIds = [];
      for (let inputs of currentGroupInputs) {
        let sharesGroup = this.getSSComputationGroupInputObjectsByShareGroupId(inputs.id);
        if (this.areNamesUnique(sharesGroup)) {
          for (let incTask of this.getTasksOfIncomingPath()) {
            if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, sharesGroup) && this.areInputsFromTaskWithStereotypeAccepted(incTask)) {
              let outputElementsNames = this.getTaskOutputObjectsBasedOnTaskStereotype(incTask).map(a => a.businessObject.name.trim());
              if (outputElementsNames) {
                if (sharesGroup.map(a => a.businessObject.name.trim()).every(elem => outputElementsNames.indexOf(elem) > -1)) {
                  correcGroupInputsIds.push(inputs.id);
                }
              }
            }
          }
        } else if (sharesGroup.map(a => a.businessObject.name.trim()).every( (val, i, arr) => val === arr[0])) {
          correcGroupInputsIds.push(inputs.id);
        }
      }
      for (let inputsId of currentGroupInputs.map(a => a.id)) {
        if (correcGroupInputsIds.indexOf(inputsId) === -1) {
          groupIds.push(inputsId);
        }
      }
    }
    for (let gId of groupIds) {
      let ids = this.getSSComputationGroupInputObjectsByShareGroupId(gId);
      for (let id of ids) {
        elementsIds.push(id.id);
      }
    }
    return elementsIds;
  }

  areThereEnoughMembersInSSComputationGroup() {
    let numberOfTasksInGroup = this.getSSComputationGroupTasks(this.getGroup()).length;
    for (let incTask of this.getTasksOfIncomingPath()) {
      if (this.registry.get(incTask).businessObject.SSSharing) {
        let computationParties = JSON.parse(this.registry.get(incTask).businessObject.SSSharing).computationParties;
        if (numberOfTasksInGroup < computationParties) {
          return false;
        }
      }
    }
    return true;
  }

  getTasksWithProblematicComputationPartiesParameter() {
    let taskIds = [];
    let numberOfTasksInGroup = this.getSSComputationGroupTasks(this.getGroup()).length;
    for (let incTask of this.getTasksOfIncomingPath()) {
      if (this.registry.get(incTask).businessObject.SSSharing) {
        let computationParties = JSON.parse(this.registry.get(incTask).businessObject.SSSharing).computationParties;
        if (numberOfTasksInGroup < computationParties) {
          taskIds.push(incTask);
        }
      }
    }
    return taskIds.sort();
  }

  areShareOfFunctionSharesDifferent() {
    let taskInputObjects = this.getTaskInputObjects();
    if (!this.areNamesUnique(taskInputObjects)) {
      return false;
    }
    return true;
  }

  areAllShareOfFunctionSharesDifferent() {
    let allGroupInputs = this.getSSComputationGroupInputs(this.getGroup());
    if (allGroupInputs) {
      for (let inputs of allGroupInputs) {
        let sharesGroup = this.getSSComputationGroupInputObjectsByShareGroupId(inputs.id);
        if (!sharesGroup.map(a => a.businessObject.name.trim()).every( (val, i, arr) => val === arr[0] )) {
          if (!this.areNamesUnique(sharesGroup)) {
            return false;
          }
        }
      }
      return true;
    }
  }

  haveGroupTasksSameNumberOfInputsAndOutputs() {
    let groupTasks = this.getSSComputationGroupTasks(this.getGroup());
    let numberOfFirstTaskInputs = this.getTaskInputObjectsByTaskId(groupTasks[0].id).length;
    let numberOfFirstTaskOutputs = this.getTaskOutputObjectsByTaskId(groupTasks[0].id).length;
    groupTasks.shift();
    for (let task of groupTasks) {
      let numberOfTaskInputs = this.getTaskInputObjectsByTaskId(task.id).length;
      let numberOfTaskOutputs = this.getTaskOutputObjectsByTaskId(task.id).length;
      // If not all group tasks have same number of inputs and outputs
      if (numberOfFirstTaskInputs != numberOfTaskInputs || numberOfFirstTaskOutputs != numberOfTaskOutputs) {
        return false;
      }
    }
    return true;
  }

  doAllInputSharesExist() {
    let allGroupInputs = this.getSSComputationGroupInputs(this.getGroup());
    if (allGroupInputs) {
      for (let inputs of allGroupInputs) {
        let sharesGroup = this.getSSComputationGroupInputObjectsByShareGroupId(inputs.id);
        for (let share of sharesGroup) {
          if (!share) {
            return false;
          }
        }
      }
      return true;
    }
  }

  getSSComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
    let groupTasks = this.getSSComputationGroupTasks(this.getGroup());
    let problematicTasks = this.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
    for (let task of groupTasks) {
      if (problematicTasks.indexOf(task.id) !== -1) {
        return groupTasks.map(a => a.id);
      }
    }
    return [];
  }

  areSSComputationGroupsTasksInSameOrderOnAllPoolsAndLanes() {
    if (!this.areGroupsTasksInSameOrderOnAllPoolsAndLanes() && this.getSSComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes().length > 0) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllSSComputationGroupsTasks();

    let groupTasks = this.getSSComputationGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = JSON.parse(this.task.SSComputation);

    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: at least 1 input and exactly 1 output are required", [this.task.id], []);
    }
    if (!this.doAllInputSharesExist()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: one or more shares (data objects) corresponding to the same input of the group are missing", groupTasksIds, []);
    } else {
      if (!this.areShareOfFunctionSharesFromSameOrigin()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: all shares corresponding to the same input must originate from the same task with SSSharing stereotype or from the same group of tasks with SSComputation stereotypes", groupTasksIds, this.getIdsOfIncorrectSharesGroups());
      } else {
        if (!this.areShareOfFunctionSharesDifferent()) {
          this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: all input function shares must be different", [this.task.id], []);
        }
        if (!this.areAllShareOfFunctionSharesDifferent()) {
          this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: all shares corresponding to the same input must be different", [this.task.id], []);
        }
        if (!this.areThereEnoughMembersInSSComputationGroup()) {
          this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: the number of members in SSComputation group is not correct (it should be equal to or greater than the number of computation parties of each task with SSSharing stereotype)", groupTasksIds, this.getTasksWithProblematicComputationPartiesParameter());
        }
      }
    }
    // If group has not enough members
    if (groupTasks.length < 2) {
      this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: group must have at least 2 members", groupTasksIds, []);
    } else {
      if (!this.areGroupTasksOnDifferentLanes()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: each group task must be on separate lane", groupTasksIds, []);
      } else {
        if (!this.areTasksParallel(groupTasksIds)) {
          this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: all group tasks must be parallel", groupTasksIds, []);
        } else {
          if (!this.areSSComputationGroupsTasksInSameOrderOnAllPoolsAndLanes()) {
            this.addUniqueErrorToErrorsList(existingErrors, "SSComputation warning: all group tasks are possibly not parallel", this.getSSComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes(), []);
          }
          if (!this.isThereAtLeastOneStartEventInCurrentTaskProcess()) {
            this.addUniqueErrorToErrorsList(existingErrors, "SSComputation warning warning: StartEvent element is missing", [this.task.id], []);
          } else {
            if (!this.areAllGroupTasksAccesible()) {
              this.addUniqueErrorToErrorsList(existingErrors, "SSComputation warning: group task is possibly not accessible to the rest of the group", [this.task.id], []);
            }
          }
        }
      }
      if (!this.haveGroupTasksSameNumberOfInputsAndOutputs()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: each group task must have same number of inputs and outputs", groupTasksIds, []);
      }
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: groupId is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputScript == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: inputScript is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputs == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SSComputation error: inputs are undefined", [this.task.id], []);
    }
  }

}