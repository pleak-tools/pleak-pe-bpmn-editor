import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";
import { OTSend } from "./OTSend";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class OTReceive extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("OTReceive", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  OTSendAndEvaluateGroupsTasks: TaskStereotypeGroupObject[] = [];

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.OTReceive != null) {
      return JSON.parse(this.task.OTReceive);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // groupId
  getCurrentStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#OTReceive-groupSelect').val();
    return {groupId: group};
  }

  getGroup() {
    return this.group;
  }

  setGroup(name: String) {
    this.group = name;
  }

  initStereotypePublicView() {
    this.init();
    this.loadAllOTSendAndOTReceiveGroupsTasks();
    super.initStereotypePublicView();
    this.highlightOTSendAndOTReceiveGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    let selectedGroupId = null;
    let groups;
    let inputObject = "";
    let outputObject = "";
    let selected = null;

    this.loadAllOTSendAndOTReceiveGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelOTSendAndOTReceiveGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its outputs would be highlighted
        this.OTSendAndEvaluateGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.getSavedStereotypeSettings() != null) {
      selectedGroupId = this.getGroup();
      selected = this.getSavedStereotypeSettings();
    } else {
      if (this.OTSendAndEvaluateGroupsTasks.length > 0) {
        selectedGroupId = this.OTSendAndEvaluateGroupsTasks[0].groupId;
      }
    }

    this.highlightOTSendAndOTReceiveGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelOTSendAndOTReceiveGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelOTSendAndOTReceiveGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    for (let inputObj of this.getTaskInputObjects()) {
      inputObject += '<li>' + inputObj.businessObject.name + '</li>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of this.getOTSendAndOTReceiveGroupTasks(selectedGroupId)) {
        if (groupTask.id != this.task.id && groupTask.businessObject.OTSend != null) {
          let taskName = undefined;
          if (groupTask.businessObject.name) {
            taskName = groupTask.businessObject.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
          taskObjs += '<label class="text-16">' + taskName + '</label>'
          taskObjs += '<ul class="stereotype-option">';

          let taskInputs = '<label class="text-16">Input data</label>';
          for (let inputObj of this.getTaskHandlerByTaskId(groupTask.id).getTaskInputObjects()) {
            taskInputs += '<li>' + inputObj.businessObject.name + '</li>';
          }

          taskObjs += taskInputs;
          taskObjs += '</ul>';
        }
      }
    }
  
    this.settingsPanelContainer.find('#OTReceive-groupSelect').html(groups);
    this.settingsPanelContainer.find('#OTReceive-newGroup').html('');
    this.settingsPanelContainer.find('#OTReceive-inputObject').html(inputObject);
    this.settingsPanelContainer.find('#OTReceive-outputObject').html(outputObject);
    this.settingsPanelContainer.find('#OTReceive-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllOTSendAndOTReceiveGroupsAndTheirInputsOutputsHighlights();
    this.OTSendAndEvaluateGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let self = this;
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let currentStereotypeSettings = this.getCurrentStereotypeSettings();
      let group = currentStereotypeSettings.groupId;
      if (group) {
        let tasks = this.getOTSendAndOTReceiveGroupTasks(group);
        let taskAlreadyInGroup = tasks.filter(( obj ) => {
          return obj.id == self.task.id;
        });
        if (tasks.length === 2 && taskAlreadyInGroup.length !== 1) {
          this.settingsPanelContainer.find('#OTReceive-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#OTReceive-groupSelect-help2').show();
          return;
        } else if (tasks.length === 1) {
          for (let task of tasks) {
            if (task.businessObject.OTReceive != null && task.id != this.task.id) {
              this.settingsPanelContainer.find('#OTReceive-groupSelect-form-group').addClass('has-error');
              this.settingsPanelContainer.find('#OTReceive-groupSelect-help2').show();
              return;
            }
          }
        }
        if (this.getSavedStereotypeSettings() == null) {
          this.addStereotypeToElement();
        }
        this.setGroup(group);
        this.OTSendAndEvaluateGroupsTasks = $.grep(this.OTSendAndEvaluateGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
        this.OTSendAndEvaluateGroupsTasks.push({groupId: group, taskId: this.task.id});
        for (let task of this.getOTSendAndOTReceiveGroupTasks(group)) {
          if (task.id == this.task.id) {
            task.businessObject.OTReceive = JSON.stringify(currentStereotypeSettings);
          }
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        return true;
      } else {
        this.settingsPanelContainer.find('#OTReceive-groupSelect-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#OTReceive-groupSelect-help').show();
      }
    } else {
      this.settingsPanelContainer.find('#OTReceive-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#OTReceive-conditions-help').show();
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

  /** OTReceive class specific functions */
  init() {
    if (this.getSavedStereotypeSettings() != null) {
      this.setGroup(this.getSavedStereotypeSettings().groupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllOTSendAndOTReceiveGroupsTasks() {
    this.OTSendAndEvaluateGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "OTReceive" && (<OTReceive>stereotype).getGroup() != null) {
          this.OTSendAndEvaluateGroupsTasks.push({groupId: (<OTReceive>stereotype).getGroup(), taskId: stereotype.task.id});
        }
        if (stereotype.getTitle() == "OTSend" && (<OTSend>stereotype).getGroup() != null) {
          this.OTSendAndEvaluateGroupsTasks.push({groupId: (<OTSend>stereotype).getGroup(), taskId: stereotype.task.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#OTReceive-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#OTReceive-newGroup').val();
      this.addOTReceiveGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#OTReceive-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#OTReceive-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#OTReceive-groupSelect');
  }

  addOTReceiveGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#OTReceive-newGroup').val('');
      this.settingsPanelContainer.find('#OTReceive-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#OTReceive-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#OTReceive-newGroup-help').show();
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

  highlightOTSendAndOTReceiveGroupMembersAndTheirInputsOutputs(group: String) {

    for (let i = 0; i < this.OTSendAndEvaluateGroupsTasks.length; i++) {
      let groupId = this.OTSendAndEvaluateGroupsTasks[i].groupId;
      let taskId = this.OTSendAndEvaluateGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getOTSendAndOTReceiveGroupInputOutputObjects(groupId);

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

  removeAllOTSendAndOTReceiveGroupsAndTheirInputsOutputsHighlights() {
    if (this.OTSendAndEvaluateGroupsTasks) {
      for (let i = 0; i < this.OTSendAndEvaluateGroupsTasks.length; i++) {
        let taskId = this.OTSendAndEvaluateGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getOTSendAndOTReceiveGroupInputOutputObjects(this.OTSendAndEvaluateGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelOTSendAndOTReceiveGroups() {
    let difGroups = [];
    for (let i = 0; i < this.OTSendAndEvaluateGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.OTSendAndEvaluateGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.OTSendAndEvaluateGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getOTSendAndOTReceiveGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.OTSendAndEvaluateGroupsTasks, function(el, idx) {return el.groupId.trim() == group.trim()}, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getOTSendAndOTReceiveGroupInputOutputObjects(group: String) {
    let objects = [];
    if (this.OTSendAndEvaluateGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getOTSendAndOTReceiveGroupTasks(group)) {
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

  getGroupSecondElementId() {
    let groupTasks = this.getOTSendAndOTReceiveGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    if (groupTasksIds.length === 2) {
      groupTasksIds.splice(groupTasksIds.indexOf(this.task.id),1);
      return groupTasksIds[0];
    }
    return null;
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
  areInputsAndOutputsNumbersCorrect() {
    // Must have:
    // Inputs: exactly 1
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 1 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areGroupTasksOnDifferentLanes() {
    let groupTasks = this.getOTSendAndOTReceiveGroupTasks(this.getGroup());
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

  getMessageFlowsOfIncomingPath() {
    let incMessageFlows = [];
    let incomingTasks = this.getTasksOfIncomingPath();
    for (let el of this.task.$parent.$parent.rootElements) {
      if (el.$type === "bpmn:Collaboration") {
        if (el.messageFlows) {
          for (let mF of el.messageFlows) {
            if (mF.sourceRef.$type === "bpmn:Task" && (incomingTasks.indexOf(mF.sourceRef.id) !== -1 || this.task.id == mF.sourceRef.id)) {
              incMessageFlows.push(mF.id)
            }
          }
        }
      }
    }
    return $.unique(incMessageFlows);
  }

  areStereotypesCorrectlyConnected() {
    let messageFlowsConnenctingGroupTaskIds = $.grep(this.getMessageFlowsOfIncomingPath(), (element) => {
      return $.inArray(element, this.getTaskHandlerByTaskId(this.getGroupSecondElementId()).getTaskStereotypeInstanceByName("OTSend").getMessageFlowsOfOutgoingPath() ) !== -1;
    });
    if (messageFlowsConnenctingGroupTaskIds.length !== 1) {
      return false;
    }
    for (let el of this.task.$parent.$parent.rootElements) {
      if (el.$type === "bpmn:Collaboration") {
        if (el.messageFlows) {
          for (let mF of el.messageFlows) {
            if (mF.sourceRef.$type === "bpmn:Task" && mF.targetRef.$type === "bpmn:Task") {
              if ((mF.sourceRef.id == this.task.id && mF.targetRef.id == this.getGroupSecondElementId()) || (mF.targetRef.id == this.task.id && mF.sourceRef.id == this.getGroupSecondElementId())) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  areStereotypesInCorrectOrder() {
    return this.taskIsInIncomingPath(this.getGroupSecondElementId()) && !this.taskIsInOutgoingPath(this.getGroupSecondElementId());
  }

  getOTSendAndOTReceiveGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
    let groupTasks = this.getOTSendAndOTReceiveGroupTasks(this.getGroup());
    let problematicTasks = this.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
    for (let task of groupTasks) {
      if (problematicTasks.indexOf(task.id) !== -1) {
        return groupTasks.map(a => a.id);
      }
    }
    return [];
  }

  areOTTasksInSameOrderOnAllPoolsAndLanes() {
    if (!this.areGroupsTasksInSameOrderOnAllPoolsAndLanes() && this.getOTSendAndOTReceiveGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes().length > 0) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllOTSendAndOTReceiveGroupsTasks();

    let groupTasks = this.getOTSendAndOTReceiveGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = this.getSavedStereotypeSettings();

    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "OTReceive error: exactly 1 input and 1 output are required", [this.task.id], []);
    }
    if (groupTasks.length < 2) {
      this.addUniqueErrorToErrorsList(existingErrors, "OTReceive error: element with OTSend stereotype is missing from the group", [this.task.id], []);
    } else {
      if (!this.areGroupTasksOnDifferentLanes()) {
        this.addUniqueErrorToErrorsList(existingErrors, "OTSend & OTReceive error: both group tasks must be on separate lane", groupTasksIds, []);
      } else {
        if (!this.areTasksParallel(groupTasksIds)) {
          if (!this.areStereotypesCorrectlyConnected()) {
            this.addUniqueErrorToErrorsList(existingErrors, "OTSend & OTReceive error: element with OTReceive stereotype in this group must be directly connected (through message flow) to the element with OTSend stereotype and there must be no other connections between them", groupTasksIds, []);
          } else {
            if (!this.areStereotypesInCorrectOrder()) {
              this.addUniqueErrorToErrorsList(existingErrors, "OTSend & OTReceive error: element with OTSend stereotype in this group must be before element with OTReceive stereotype", groupTasksIds, []);
            }
          }
        } else {
          if (!this.areOTTasksInSameOrderOnAllPoolsAndLanes()) {
            this.addUniqueErrorToErrorsList(existingErrors, "OTSend & OTReceive warning: all group tasks are possibly not parallel", this.getOTSendAndOTReceiveGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes(), []);
          }
          if (!this.isThereAtLeastOneStartEventInCurrentTaskProcess()) {
            this.addUniqueErrorToErrorsList(existingErrors, "OTSend & OTReceive warning warning: StartEvent element is missing", [this.task.id], []);
          } else {
            if (!this.areAllGroupTasksAccesible()) {
              this.addUniqueErrorToErrorsList(existingErrors, "OTSend & OTReceive warning: group task is possibly not accessible to the rest of the group", [this.task.id], []);
            }
          }
        }
      }
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "OTReceive error: groupId is undefined", [this.task.id], []);
    }
  }

}