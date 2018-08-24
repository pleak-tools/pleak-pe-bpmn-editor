import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";
import { SGXAttestationEnclave } from "./SGXAttestationEnclave";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SGXAttestationChallenge extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXAttestationChallenge", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  SGXAttestationEnclaveAndEvaluateGroupsTasks: TaskStereotypeGroupObject[] = [];

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
    this.loadAllSGXAttestationGroupsTasks();
    super.initStereotypePublicView();
    this.highlightSGXAttestationGroupMembersAndTheirInputsOutputs(this.getGroup());
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

    this.loadAllSGXAttestationGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelSGXAttestationGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its outputs would be highlighted
        this.SGXAttestationEnclaveAndEvaluateGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.task.SGXAttestationChallenge != null) {
      selectedGroupId = this.getGroup();
      selected = JSON.parse(this.task.SGXAttestationChallenge);
    } else {
      if (this.SGXAttestationEnclaveAndEvaluateGroupsTasks.length > 0) {
        selectedGroupId = this.SGXAttestationEnclaveAndEvaluateGroupsTasks[0].groupId;
      }
    }

    this.highlightSGXAttestationGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelSGXAttestationGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelSGXAttestationGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
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
      for (let groupTask of this.getSGXAttestationGroupTasks(selectedGroupId)) {
        if (groupTask.id != this.task.id && groupTask.businessObject.SGXAttestationEnclave != null) {
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
  
    this.settingsPanelContainer.find('#SGXAttestationChallenge-taskName').text(this.task.name);
    this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect').html(groups);
    this.settingsPanelContainer.find('#SGXAttestationChallenge-newGroup').html('');
    this.settingsPanelContainer.find('#SGXAttestationChallenge-inputObject').html(inputObject);
    this.settingsPanelContainer.find('#SGXAttestationChallenge-outputObject').html(outputObject);
    this.settingsPanelContainer.find('#SGXAttestationChallenge-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllSGXAttestationGroupsAndTheirInputsOutputsHighlights();
    this.SGXAttestationEnclaveAndEvaluateGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let self = this;
    let group = this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect').val();
    if (group) {
      if (this.areInputsAndOutputsNumbersCorrect()) {
        let tasks = this.getSGXAttestationGroupTasks(group);
        let taskAlreadyInGroup = tasks.filter(( obj ) => {
          return obj.id == self.task.id;
        });
        if (tasks.length === 2 && taskAlreadyInGroup.length !== 1) {
          this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect-help2').show();
          return;
        } else if (tasks.length === 1) {
          for (let task of tasks) {
            if (task.businessObject.SGXAttestationChallenge != null && task.id != this.task.id) {
              this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect-form-group').addClass('has-error');
              this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect-help2').show();
              return;
            }
          }
        }
        if (this.task.SGXAttestationChallenge == null) {
          this.addStereotypeToElement();
        }
        this.setGroup(group);
        this.SGXAttestationEnclaveAndEvaluateGroupsTasks = $.grep(this.SGXAttestationEnclaveAndEvaluateGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
        this.SGXAttestationEnclaveAndEvaluateGroupsTasks.push({groupId: group, taskId: this.task.id});
        for (let task of this.getSGXAttestationGroupTasks(group)) {
          if (task.id == this.task.id) {
            task.businessObject.SGXAttestationChallenge = JSON.stringify({groupId: group});
          }
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        super.saveStereotypeSettings();
      } else {
        this.settingsPanelContainer.find('#SGXAttestationChallenge-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXAttestationChallenge-conditions-help').show();
        this.initSaveAndRemoveButtons();
      }
    } else {
      this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect-help').show();
    }
  }

  removeStereotype() {
    if (confirm('Are you sure you wish to remove the stereotype?')) {
      super.removeStereotype();
    } else {
      this.initSaveAndRemoveButtons();
      return false;
    }
  }

  /** SGXAttestationChallenge class specific functions */
  init() {
    if (this.task.SGXAttestationChallenge != null) {
      this.setGroup(JSON.parse(this.task.SGXAttestationChallenge).groupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllSGXAttestationGroupsTasks() {
    this.SGXAttestationEnclaveAndEvaluateGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "SGXAttestationChallenge" && (<SGXAttestationChallenge>stereotype).getGroup() != null) {
          this.SGXAttestationEnclaveAndEvaluateGroupsTasks.push({groupId: (<SGXAttestationChallenge>stereotype).getGroup(), taskId: stereotype.task.id});
        }
        if (stereotype.getTitle() == "SGXAttestationEnclave" && (<SGXAttestationEnclave>stereotype).getGroup() != null) {
          this.SGXAttestationEnclaveAndEvaluateGroupsTasks.push({groupId: (<SGXAttestationEnclave>stereotype).getGroup(), taskId: stereotype.task.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#SGXAttestationChallenge-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#SGXAttestationChallenge-newGroup').val();
      this.addSGXAttestationChallengeGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#SGXAttestationChallenge-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#SGXAttestationChallenge-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#SGXAttestationChallenge-groupSelect');
  }

  addSGXAttestationChallengeGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#SGXAttestationChallenge-newGroup').val('');
      this.settingsPanelContainer.find('#SGXAttestationChallenge-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#SGXAttestationChallenge-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXAttestationChallenge-newGroup-help').show();
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

  highlightSGXAttestationGroupMembersAndTheirInputsOutputs(group: String) {

    for (let i = 0; i < this.SGXAttestationEnclaveAndEvaluateGroupsTasks.length; i++) {
      let groupId = this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].groupId;
      let taskId = this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getSGXAttestationGroupInputOutputObjects(groupId);

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

  removeAllSGXAttestationGroupsAndTheirInputsOutputsHighlights() {
    if (this.SGXAttestationEnclaveAndEvaluateGroupsTasks) {
      for (let i = 0; i < this.SGXAttestationEnclaveAndEvaluateGroupsTasks.length; i++) {
        let taskId = this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getSGXAttestationGroupInputOutputObjects(this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelSGXAttestationGroups() {
    let difGroups = [];
    for (let i = 0; i < this.SGXAttestationEnclaveAndEvaluateGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getSGXAttestationGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.SGXAttestationEnclaveAndEvaluateGroupsTasks, function(el, idx) {return el.groupId.trim() == group.trim()}, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getSGXAttestationGroupInputOutputObjects(group: String) {
    let objects = [];
    if (this.SGXAttestationEnclaveAndEvaluateGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getSGXAttestationGroupTasks(group)) {
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
    let groupTasks = this.getSGXAttestationGroupTasks(this.getGroup());
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
    // Outputs: exactly 1
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  areGroupTasksOnDifferentLanes() {
    let groupTasks = this.getSGXAttestationGroupTasks(this.getGroup());
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

  getSGXAttestationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
    let groupTasks = this.getSGXAttestationGroupTasks(this.getGroup());
    let problematicTasks = this.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
    for (let task of groupTasks) {
      if (problematicTasks.indexOf(task.id) !== -1) {
        return groupTasks.map(a => a.id);
      }
    }
    return [];
  }

  areSGXAttestationTasksInSameOrderOnAllPoolsAndLanes() {
    if (!this.areGroupsTasksInSameOrderOnAllPoolsAndLanes() && this.getSGXAttestationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes().length > 0) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllSGXAttestationGroupsTasks();

    let groupTasks = this.getSGXAttestationGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = JSON.parse(this.task.SGXAttestationChallenge);

    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationChallenge error: exactly 1 output is required", [this.task.id], []);
    }
    if (groupTasks.length < 2) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationChallenge error: element with SGXAttestationEnclave stereotype is missing from the group", [this.task.id], []);
    } else {
      if (!this.areGroupTasksOnDifferentLanes()) {
        this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationEnclave & SGXAttestationChallenge error: both group tasks must be on separate lane", groupTasksIds, []);
      } else {
        if (!this.areTasksParallel(groupTasksIds)) {
          this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationEnclave & SGXAttestationChallenge error: both group tasks must be parallel", groupTasksIds, []);
        } else {
          if (!this.areSGXAttestationTasksInSameOrderOnAllPoolsAndLanes()) {
            this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationEnclave & SGXAttestationChallenge warning: all group tasks are possibly not parallel", this.getSGXAttestationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes(), []);
          }
          if (!this.isThereAtLeastOneStartEventInCurrentTaskProcess()) {
            this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationEnclave & SGXAttestationChallenge warning warning: StartEvent element is missing", [this.task.id], []);
          } else {
            if (!this.areAllGroupTasksAccesible()) {
              this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationEnclave & SGXAttestationChallenge warning: group task is possibly not accessible to the rest of the group", [this.task.id], []);
            }
          }
        }
      }
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationChallenge error: groupId is undefined", [this.task.id], []);
    }
  }

}