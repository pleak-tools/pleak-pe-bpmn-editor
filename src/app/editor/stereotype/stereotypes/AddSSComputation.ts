import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class AddSSComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("AddSSComputation", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  AddSSComputationGroupsTasks: TaskStereotypeGroupObject[] = [];

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.AddSSComputation != null) {
      return JSON.parse(this.task.AddSSComputation);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // groupId
  // inputScript
  // inputs
  getCurrentStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#AddSSComputation-groupSelect').val();
    let inputScript = this.settingsPanelContainer.find('#AddSSComputation-inputScript').val();
    let inputObjects = this.getTaskInputObjects();
    let inputs = [];
    let groupTasks = this.getAddSSComputationGroupTasks(group);
    if (groupTasks.length === 0 || groupTasks.length === 1 && groupTasks[0].id == this.task.id) {
      for (let i = 0; i < inputObjects.length; i++) {
        inputs.push({id: i, inputs: [{id: inputObjects[i].id}]});
      }
    } else {
      let savedInputs = this.getAddSSComputationGroupInputs(group);
      let taskInputs = this.getTaskInputObjects();
      for (let sInput of savedInputs) {
        let selectedInput = $('#AddSSComputation-inputSelect-'+sInput.id).val();
        if (this.taskHasInputElement(selectedInput)) {
          let newInputId = sInput.id;
          let newInputInputs = sInput.inputs;
          for (let tInput of taskInputs) {
            newInputInputs = newInputInputs.filter(function( obj ) {
              return obj.id !== tInput.id;
            });
          }
          newInputInputs.push({id: selectedInput})
          newInputInputs = newInputInputs.sort(this.compareIds);
          inputs.push({id: newInputId, inputs: newInputInputs});
        }
      }
    }
    return {groupId: group, inputScript: inputScript, inputs: inputs};
  }

  getGroup() {
    return this.group;
  }

  setGroup(name: String) {
    this.group = name;
  }

  initStereotypePublicView() {
    this.init();
    this.loadAllAddSSComputationGroupsTasks();
    super.initStereotypePublicView();
    this.highlightAddSSComputationGroupMembersAndTheirInputsOutputs(this.getGroup());
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

    this.loadAllAddSSComputationGroupsTasks();

    let AddSSComputationGroups = this.getModelAddSSComputationGroups();

    if (this.selectedGroup != null) {
      if (AddSSComputationGroups.indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its inputs and outputs would be highlighted
        this.AddSSComputationGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.getSavedStereotypeSettings() != null) {
      selectedGroupId = this.getGroup();
    } else {
      if (this.AddSSComputationGroupsTasks.length > 0) {
        selectedGroupId = this.AddSSComputationGroupsTasks[0].groupId;
      }
    }

    let groupTasks = null;
    if (selectedGroupId !== null) {
      groupTasks = this.getAddSSComputationGroupTasks(selectedGroupId);
    }

    inputScript = this.getAddSSComputationGroupInputScript(selectedGroupId);
    this.highlightAddSSComputationGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of AddSSComputationGroups) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (AddSSComputationGroups.indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    let taskInputs = this.getTaskInputObjects();
    if (this.getAddSSComputationGroupInputs(selectedGroupId) && this.getAddSSComputationGroupInputs(selectedGroupId).length > 0 && groupTasks && groupTasks.length >= 1) {
      let groupInputs = this.getAddSSComputationGroupInputs(selectedGroupId);
      let taskInputNamesStr = this.getTaskInputObjects().map(a => a.businessObject.name).sort().toString();
      let groupInputNames = [];
      for (let input of groupInputs) {
        for (let inp of input.inputs) {
          groupInputNames.push(this.registry.get(inp.id).businessObject.name);
        }
      }

      let groupInputNamesStr = groupInputNames.sort().toString();
      if (groupInputNamesStr != taskInputNamesStr) {
        for (let groupInput of groupInputs) {
          let groupInputInputs = groupInput.inputs;
          let inputNames = groupInput.inputs;

          let inputNamesStr = [];
          for (let input of inputNames) {
            inputNamesStr.push(this.registry.get(input.id).businessObject.name);
          }

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
          inputObjects += inputNamesStr.sort().toString() + ': ' + '<select class="form-control stereotype-option" id="AddSSComputation-inputSelect-' + groupInput.id +'">' + inputSel + '</select>';
        }
        this.settingsPanelContainer.find('#AddSSComputation-inputObjects-title').text("Choose corresponding inputs");
      } else {
        for (let inputObject of taskInputs) {
          inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
        }
        this.settingsPanelContainer.find('#AddSSComputation-inputObjects-title').text("Input data objects");
      }
    } else {
      for (let inputObject of taskInputs) {
        inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
      }
      this.settingsPanelContainer.find('#AddSSComputation-inputObjects-title').text("Input data objects");
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of groupTasks) {
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
  
    this.settingsPanelContainer.find('#AddSSComputation-groupSelect').html(groups);
    this.settingsPanelContainer.find('#AddSSComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#AddSSComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#AddSSComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#AddSSComputation-newGroup').html('');
    this.settingsPanelContainer.find('#AddSSComputation-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllAddSSComputationGroupsAndTheirInputsOutputsHighlights();
    this.AddSSComputationGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let currentStereotypeSettings = this.getCurrentStereotypeSettings();
      let group = currentStereotypeSettings.groupId;
      if (group) {
        this.setGroup(group);
        this.AddSSComputationGroupsTasks = $.grep(this.AddSSComputationGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
        this.AddSSComputationGroupsTasks.push({groupId: group, taskId: this.task.id});
        // Check if all selected inputs are different
        if (this.getAddSSComputationGroupTasks(group).length > 1) {
          let savedInputs = this.getAddSSComputationGroupInputs(group);
          let selectedInputs = [];
          for (let sInput of savedInputs) {
            selectedInputs.push($('#AddSSComputation-inputSelect-'+sInput.id).val());
          }
          let hasDuplicates = selectedInputs.some(function(item, idx){
            return selectedInputs.indexOf(item) != idx
          });
          if (hasDuplicates) {
            this.settingsPanelContainer.find('#AddSSComputation-inputs-form-group').addClass('has-error');
            this.settingsPanelContainer.find('#AddSSComputation-inputs-help').show();
            this.initRemoveButton();
            return;
          }

        }
        if (this.getSavedStereotypeSettings() == null) {
          this.addStereotypeToElement();
        }
        for (let task of this.getAddSSComputationGroupTasks(group)) {
          task.businessObject.AddSSComputation = JSON.stringify(currentStereotypeSettings);
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        return true;
      } else {
        this.settingsPanelContainer.find('#AddSSComputation-groupSelect-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#AddSSComputation-groupSelect-help').show();
      }
    } else {
      this.settingsPanelContainer.find('#AddSSComputation-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#AddSSComputation-conditions-help').show();
      this.initRemoveButton();
    }
  }

  removeStereotype() {
    if (confirm('Are you sure you wish to remove the stereotype?')) {
      let group = this.getGroup();
      let inputScript = this.getAddSSComputationGroupInputScript(group);
      if (this.getAddSSComputationGroupTasks(group).length > 1 && this.getSavedStereotypeSettings().inputs) {
        let inputs = [];
        let savedInputs = this.getAddSSComputationGroupInputs(group);
        let taskInputs = this.getTaskInputObjects();
        for (let sInput of savedInputs) {
          let newInputId = sInput.id;
          let newInputInputs = sInput.inputs;
          for (let tInput of taskInputs) {
            newInputInputs = newInputInputs.filter(function( obj ) {
              return obj.id !== tInput.id;
            });
          }
          newInputInputs = newInputInputs.sort(this.compareIds);
          inputs.push({id: newInputId, inputs: newInputInputs});
        }
        for (let task of this.getAddSSComputationGroupTasks(group)) {
          task.businessObject.AddSSComputation = JSON.stringify({groupId: group, inputScript: inputScript, inputs: inputs});
          this.getTaskHandlerByTaskId(task.id).getTaskStereotypeInstanceByName("AddSSComputation").loadAllAddSSComputationGroupsTasks();
        }
      }
      this.loadAllAddSSComputationGroupsTasks();
      super.removeStereotype();
    } else {
      this.initRemoveButton();
      return false;
    }
  }

  /** AddSSComputation class specific functions */
  init() {
    if (this.getSavedStereotypeSettings() != null) {
      this.setGroup(this.getSavedStereotypeSettings().groupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllAddSSComputationGroupsTasks() {
    this.AddSSComputationGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "AddSSComputation" && (<AddSSComputation>stereotype).getGroup() != null) {
          this.AddSSComputationGroupsTasks.push({groupId: (<AddSSComputation>stereotype).getGroup(), taskId: stereotype.task.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#AddSSComputation-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#AddSSComputation-newGroup').val();
      this.addAddSSComputationGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#AddSSComputation-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#AddSSComputation-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#AddSSComputation-groupSelect');
  }

  addAddSSComputationGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#AddSSComputation-newGroup').val('');
      this.settingsPanelContainer.find('#AddSSComputation-inputScript').val('');
      this.settingsPanelContainer.find('#AddSSComputation-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#AddSSComputation-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#AddSSComputation-newGroup-help').show();
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
      this.initStereotypeSettings();
    }

    // Set selected group back to null (in case new group is not going to be saved)
    this.selectedGroup = null;
  }

  highlightAddSSComputationGroupMembersAndTheirInputsOutputs(group: String) {

    for (let i = 0; i < this.AddSSComputationGroupsTasks.length; i++) {
      let groupId = this.AddSSComputationGroupsTasks[i].groupId;
      let taskId = this.AddSSComputationGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getAddSSComputationGroupInputOutputObjects(groupId);

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

  removeAllAddSSComputationGroupsAndTheirInputsOutputsHighlights() {
    if (this.AddSSComputationGroupsTasks) {
      for (let i = 0; i < this.AddSSComputationGroupsTasks.length; i++) {
        let taskId = this.AddSSComputationGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getAddSSComputationGroupInputOutputObjects(this.AddSSComputationGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelAddSSComputationGroups() {
    let difGroups = [];
    for (let i = 0; i < this.AddSSComputationGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.AddSSComputationGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.AddSSComputationGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getAddSSComputationGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.AddSSComputationGroupsTasks, function(el, idx) {return el.groupId.trim() == group.trim()}, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getGroupOutputs(group: String) {
    this.init();
    this.loadAllAddSSComputationGroupsTasks();
    let groupTasks = this.getAddSSComputationGroupTasks(group);
    let outputs = [];
    for (let task of groupTasks) {
      outputs = outputs.concat(this.getTaskOutputObjectsByTaskId(task.id));
    }
    return outputs;
  }

  getAddSSComputationGroupInputOutputObjects(group: String) {
    let objects = [];
    if (this.AddSSComputationGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getAddSSComputationGroupTasks(group)) {
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

  getAddSSComputationGroupInputScript(group: String) {
    let script = "";
    if (group != null) {
      let groupTasks = this.getAddSSComputationGroupTasks(group);
      if (groupTasks.length === 1) {
        if (groupTasks[0].businessObject.AddSSComputation) {
          script = JSON.parse(groupTasks[0].businessObject.AddSSComputation).inputScript;
        }
        } else {
        for (let groupTask of groupTasks) {
          if (groupTask.id != this.task.id) {
            script = JSON.parse(groupTask.businessObject.AddSSComputation).inputScript;
            break;
          }
        }
      }
    }
    return script;
  }

  getAddSSComputationGroupInputs(group: String) {
    let inputs = [];
    if (group != null) {
      let groupTasks = this.getAddSSComputationGroupTasks(group);
      if (groupTasks.length === 1) {
        if (groupTasks[0].businessObject.AddSSComputation) {
          inputs = JSON.parse(groupTasks[0].businessObject.AddSSComputation).inputs;
        }
        } else {
        for (let groupTask of groupTasks) {
          if (groupTask.id != this.task.id) {
            inputs = JSON.parse(groupTask.businessObject.AddSSComputation).inputs;
            break;
          }
        }
      }
    }
    return inputs;
  }

  getAddSSComputationGroupInputObjectsByShareGroupId(id: String) {
    let objects = [];
    if (this.getAddSSComputationGroupInputs(this.getGroup())) {
      for (let inputs of this.getAddSSComputationGroupInputs(this.getGroup())) {
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
      let allGroupInputs = this.getAddSSComputationGroupInputs(this.getGroup());
      if (allGroupInputs) {
        for (let inputs of allGroupInputs) {
          let sharesGroup = this.getAddSSComputationGroupInputObjectsByShareGroupId(inputs.id);
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
    if (taskOutputs.map(a => a.id).indexOf(dataObjectId) !== -1) {
      statuses.push("private-o");
    }
    if (statuses.length > 0) {
      return statuses;
    }
    return null;
  }

  compareIds(a,b) {
    if (a.id < b.id)
      return -1;
    if (a.id > b.id)
      return 1;
    return 0;
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
    // AddSSComputation
    // FunSSComputation
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.AddSSSharing || task.businessObject.AddSSComputation || task.businessObject.FunSSComputation) {
          return true;
        }
      }
    }
    return false;
  }

  areGroupTasksOnDifferentLanes() {
    let groupTasks = this.getAddSSComputationGroupTasks(this.getGroup());
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
    let currentGroupInputs = this.getAddSSComputationGroupInputs(this.getGroup());
    if (currentGroupInputs) {
      let correcGroupInputsIds = [];
      for (let inputs of currentGroupInputs) {
        let sharesGroup = this.getAddSSComputationGroupInputObjectsByShareGroupId(inputs.id);
        if (this.areNamesUnique(sharesGroup)) {
          for (let incTask of this.getTasksOfIncomingPath()) {
            if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, sharesGroup) && this.areInputsFromTaskWithStereotypeAccepted(incTask)) {
              let outputElementsNames = this.elementHandler.elementsHandler.getTaskHandlerByTaskId(incTask).getTaskOutputObjectsBasedOnTaskStereotype().map(a => a.businessObject.name.trim());
              let matchingNames = [];
              if (outputElementsNames) {
                for (let inputObject of sharesGroup) {
                  for (let outputElementName of outputElementsNames) {
                    if (inputObject.businessObject.name.trim() === outputElementName) {
                      matchingNames.push(outputElementName.trim());
                    }
                  }
                }
                outputElementsNames.sort();
                matchingNames.sort();
                if (outputElementsNames.toString() === matchingNames.toString()) {
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
      let ids = this.getAddSSComputationGroupInputObjectsByShareGroupId(gId);
      for (let id of ids) {
        elementsIds.push(id.id);
      }
    }
    return elementsIds;
  }

  areShareOfFunctionSharesDifferent() {
    let taskInputObjects = this.getTaskInputObjects();
    if (!this.areNamesUnique(taskInputObjects)) {
      return false;
    }
    return true;
  }

  areAllShareOfFunctionSharesDifferent() {
    let allGroupInputs = this.getAddSSComputationGroupInputs(this.getGroup());
    if (allGroupInputs) {
      for (let inputs of allGroupInputs) {
        let sharesGroup = this.getAddSSComputationGroupInputObjectsByShareGroupId(inputs.id);
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
    let groupTasks = this.getAddSSComputationGroupTasks(this.getGroup());
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
    let allGroupInputs = this.getAddSSComputationGroupInputs(this.getGroup());
    if (allGroupInputs) {
      for (let inputs of allGroupInputs) {
        let sharesGroup = this.getAddSSComputationGroupInputObjectsByShareGroupId(inputs.id);
        for (let share of sharesGroup) {
          if (!share) {
            return false;
          }
        }
      }
      return true;
    }
  }

  getAddSSComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
    let groupTasks = this.getAddSSComputationGroupTasks(this.getGroup());
    let problematicTasks = this.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
    for (let task of groupTasks) {
      if (problematicTasks.indexOf(task.id) !== -1) {
        return groupTasks.map(a => a.id);
      }
    }
    return [];
  }

  areAddSSComputationGroupsTasksInSameOrderOnAllPoolsAndLanes() {
    if (!this.areGroupsTasksInSameOrderOnAllPoolsAndLanes() && this.getAddSSComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes().length > 0) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllAddSSComputationGroupsTasks();

    let groupTasks = this.getAddSSComputationGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = this.getSavedStereotypeSettings();

    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: at least 1 input and exactly 1 output are required", [this.task.id], []);
    }
    if (!this.doAllInputSharesExist()) {
      this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: one or more shares (data objects) corresponding to the same input of the group are missing", groupTasksIds, []);
    } else {
      if (!this.areShareOfFunctionSharesFromSameOrigin()) {
        this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: all shares corresponding to the same input must originate from the same task with AddSSSharing stereotype or from the same group of tasks with AddSSComputation or FunSSComputation stereotypes", groupTasksIds, this.getIdsOfIncorrectSharesGroups());
      } else {
        if (!this.areShareOfFunctionSharesDifferent()) {
          this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: all input function shares must be different", [this.task.id], []);
        }
        if (!this.areAllShareOfFunctionSharesDifferent()) {
          this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: all shares corresponding to the same input must be different", [this.task.id], []);
        }
      }
    }
    // If group has not enough members
    if (groupTasks.length < 2) {
      this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: group must have at least 2 members", groupTasksIds, []);
    } else {
      if (!this.areGroupTasksOnDifferentLanes()) {
        this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: each group task must be on separate lane", groupTasksIds, []);
      } else {
        if (!this.areTasksParallel(groupTasksIds)) {
          this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: all group tasks must be parallel", groupTasksIds, []);
        } else {
          if (!this.areAddSSComputationGroupsTasksInSameOrderOnAllPoolsAndLanes()) {
            this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation warning: all group tasks are possibly not parallel", this.getAddSSComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes(), []);
          }
          if (!this.isThereAtLeastOneStartEventInCurrentTaskProcess()) {
            this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation warning: StartEvent element is missing", [this.task.id], []);
          } else {
            if (!this.areAllGroupTasksAccesible()) {
              this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation warning: group task is possibly not accessible to the rest of the group", [this.task.id], []);
            }
          }
        }
      }
      if (!this.haveGroupTasksSameNumberOfInputsAndOutputs()) {
        this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: each group task must have the same number of inputs and outputs", groupTasksIds, []);
      }
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: groupId is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputScript == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: inputScript is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputs == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "AddSSComputation error: inputs are undefined", [this.task.id], []);
    }
  }

}