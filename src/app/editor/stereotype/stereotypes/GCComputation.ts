import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class GCComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("GCComputation", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  GCComputationGroupsTasks: TaskStereotypeGroupObject[] = [];

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
    this.loadAllGCComputationGroupsTasks();
    super.initStereotypePublicView();
    this.highlightGCComputationGroupMembersAndTheirInputsOutputs(this.getGroup());
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

    this.loadAllGCComputationGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelGCComputationGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its inputs and outputs would be highlighted
        this.GCComputationGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.task.GCComputation != null) {
      selectedGroupId = this.getGroup();
    } else {
      if (this.GCComputationGroupsTasks.length > 0) {
        selectedGroupId = this.GCComputationGroupsTasks[0].groupId;
      }
    }

    inputScript = this.getGCComputationGroupInputScript(selectedGroupId);
    this.highlightGCComputationGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelGCComputationGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelGCComputationGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>';
    }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of this.getGCComputationGroupTasks(selectedGroupId)) {
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
  
    this.settingsPanelContainer.find('#GCComputation-taskName').text(this.task.name);
    this.settingsPanelContainer.find('#GCComputation-groupSelect').html(groups);
    this.settingsPanelContainer.find('#GCComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#GCComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#GCComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#GCComputation-newGroup').html('');
    this.settingsPanelContainer.find('#GCComputation-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllGCComputationGroupsAndTheirInputsOutputsHighlights();
    this.GCComputationGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let self = this;
    let group = this.settingsPanelContainer.find('#GCComputation-groupSelect').val();
    let inputScript = this.settingsPanelContainer.find('#GCComputation-inputScript').val();
    if (group) {
      let tasks = this.getGCComputationGroupTasks(group);
      let taskAlreadyInGroup = tasks.filter(( obj ) => {
        return obj.id == self.task.id;
      });
      if (tasks.length === 2 && taskAlreadyInGroup.length !== 1) {
        this.settingsPanelContainer.find('#GCComputation-groupSelect-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#GCComputation-groupSelect-help2').show();
        return;
      }
      if (this.task.GCComputation == null) {
        this.addStereotypeToElement();
      }
      this.setGroup(group);
      this.GCComputationGroupsTasks = $.grep(this.GCComputationGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
      this.GCComputationGroupsTasks.push({groupId: group, taskId: this.task.id});
      for (let task of this.getGCComputationGroupTasks(group)) {
        task.businessObject.GCComputation = JSON.stringify({groupId: group, inputScript: inputScript});
      }
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#GCComputation-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#GCComputation-groupSelect-help').show();
    }
  }

  removeStereotype() {
    super.removeStereotype();
  }

  /** GCComputation class specific functions */
  init() {
    if (this.task.GCComputation != null) {
      this.setGroup(JSON.parse(this.task.GCComputation).groupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllGCComputationGroupsTasks() {
    this.GCComputationGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "GCComputation" && (<GCComputation>stereotype).getGroup() != null) {
          this.GCComputationGroupsTasks.push({groupId: (<GCComputation>stereotype).getGroup(), taskId: stereotype.task.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#GCComputation-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#GCComputation-newGroup').val();
      this.addGCComputationGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#GCComputation-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#GCComputation-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#GCComputation-groupSelect');
  }

  addGCComputationGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#GCComputation-newGroup').val('');
      this.settingsPanelContainer.find('#GCComputation-inputScript').val('');
      this.settingsPanelContainer.find('#GCComputation-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#GCComputation-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#GCComputation-newGroup-help').show();
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

  highlightGCComputationGroupMembersAndTheirInputsOutputs(group: String) {

    for (let i = 0; i < this.GCComputationGroupsTasks.length; i++) {
      let groupId = this.GCComputationGroupsTasks[i].groupId;
      let taskId = this.GCComputationGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getGCComputationGroupInputOutputObjects(groupId);

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

  removeAllGCComputationGroupsAndTheirInputsOutputsHighlights() {
    if (this.GCComputationGroupsTasks) {
      for (let i = 0; i < this.GCComputationGroupsTasks.length; i++) {
        let taskId = this.GCComputationGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getGCComputationGroupInputOutputObjects(this.GCComputationGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelGCComputationGroups() {
    let difGroups = [];
    for (let i = 0; i < this.GCComputationGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.GCComputationGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.GCComputationGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getGCComputationGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.GCComputationGroupsTasks, function(el, idx) {return el.groupId.trim() == group.trim()}, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getGCComputationGroupInputOutputObjects(group: String) {
    let objects = [];
    if (this.GCComputationGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getGCComputationGroupTasks(group)) {
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

  getGCComputationGroupInputScript(group: String) {
    let script = "";
    if (group != null) {
      let groupTasks = this.getGCComputationGroupTasks(group);
      if (groupTasks.length === 1) {
        if (groupTasks[0].businessObject.GCComputation) {
          script = JSON.parse(groupTasks[0].businessObject.GCComputation).inputScript;
        }
        } else {
        for (let groupTask of groupTasks) {
          if (groupTask.id != this.task.id) {
            script = JSON.parse(groupTask.businessObject.GCComputation).inputScript;
            break;
          }
        }
      }
    }
    return script;
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: public
    // Outputs: public
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1 || outputIds.indexOf(dataObjectId) !== -1) {
      statuses.push("public-io");
    }
    if (statuses.length > 0) {
      return statuses;
    }
    return null;
  }

  /** Validation functions */
  getNumberOfGCComputationGroupInputs() {
    let groupTasks = this.getGCComputationGroupTasks(this.getGroup());
    let numberOfgroupInputs = 0;
    for (let task of groupTasks) {
      let numberOfTaskInputs = this.getTaskInputObjectsByTaskId(task.id).length;
      numberOfgroupInputs += numberOfTaskInputs;
    }
    return numberOfgroupInputs;
  }

  getNumberOfGCComputationGroupOutputs() {
    let groupTasks = this.getGCComputationGroupTasks(this.getGroup());
    let numberOfGroupOutputs = 0;
    for (let task of groupTasks) {
      let numberOfTaskOutputs = this.getTaskOutputObjectsByTaskId(task.id).length;
      numberOfGroupOutputs += numberOfTaskOutputs;
    }
    return numberOfGroupOutputs;
  }

  areGroupTasksOnDifferentLanes() {
    let groupTasks = this.getGCComputationGroupTasks(this.getGroup());
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

  getGCComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
    let groupTasks = this.getGCComputationGroupTasks(this.getGroup());
    let problematicTasks = this.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
    for (let task of groupTasks) {
      if (problematicTasks.indexOf(task.id) !== -1) {
        return groupTasks.map(a => a.id);
      }
    }
    return [];
  }

  areGCComputationroupsTasksInSameOrderOnAllPoolsAndLanes() {
    if (!this.areGroupsTasksInSameOrderOnAllPoolsAndLanes() && this.getGCComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes().length > 0) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllGCComputationGroupsTasks();

    let groupTasks = this.getGCComputationGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = JSON.parse(this.task.GCComputation);

    // If group has no inputs or outputs
    if (this.getNumberOfGCComputationGroupInputs() == 0 || this.getNumberOfGCComputationGroupOutputs() == 0) {
      this.addUniqueErrorToErrorsList(existingErrors, "GCComputation error: group must have at least 1 input and 1 output object", groupTasksIds, []);
    }
    // If group has not enough members
    if (groupTasks.length < 2) {
      this.addUniqueErrorToErrorsList(existingErrors, "GCComputation error: group must have exactly 2 members", groupTasksIds, []);
    } else {
      if (!this.areGroupTasksOnDifferentLanes()) {
        this.addUniqueErrorToErrorsList(existingErrors, "GCComputation error: each group task must be on separate lane", groupTasksIds, []);
      } else {
        if (!this.areTasksParallel(groupTasksIds)) {
          this.addUniqueErrorToErrorsList(existingErrors, "GCComputation error: all group tasks must be parallel", groupTasksIds, []);
        } else {
          if (!this.areGCComputationroupsTasksInSameOrderOnAllPoolsAndLanes()) {
            this.addUniqueErrorToErrorsList(existingErrors, "GCComputation warning: all group tasks are possibly not parallel", this.getGCComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes(), []);
          }
          if (!this.isThereAtLeastOneStartEventInCurrentTaskProcess()) {
            this.addUniqueErrorToErrorsList(existingErrors, "GCComputation warning: StartEvent element is missing", [this.task.id], []);
          } else {
            if (!this.areAllGroupTasksAccesible()) {
              this.addUniqueErrorToErrorsList(existingErrors, "GCComputation warning: group task is possibly not accessible to the rest of the group", [this.task.id], []);
            }
          }
        }
      }
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "GCComputation error: groupId is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputScript == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "GCComputation error: inputScript is undefined", [this.task.id], []);
    }
  }

}