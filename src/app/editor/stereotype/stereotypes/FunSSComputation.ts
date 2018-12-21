import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class FunSSComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("FunSSComputation", taskHandler);
    this.init();
  }

  group: string = null;
  selectedGroup: string = null;
  FunSSComputationGroupsTasks: TaskStereotypeGroupObject[] = [];

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.FunSSComputation != null) {
      return JSON.parse(this.task.FunSSComputation);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // groupId
  // evaluationPoint
  // shareOfFunction
  getCurrentStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#FunSSComputation-groupSelect').val();
    let evaluationPoint = this.settingsPanelContainer.find('#FunSSComputation-evaluationPointSelect').val();
    let shareOfFunction = this.settingsPanelContainer.find('#FunSSComputation-shareOfFunctionSelect').val();
    return { groupId: group, evaluationPoint: evaluationPoint, shareOfFunction: shareOfFunction };
  }

  getGroup() {
    return this.group;
  }

  setGroup(name: string) {
    this.group = name;
  }

  initStereotypePublicView() {
    this.init();
    this.loadAllFunSSComputationGroupsTasks();
    super.initStereotypePublicView();
    this.highlightFunSSComputationGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    let selectedGroupId = null;
    let groups;
    let evaluationPointValues;
    let shareOfFunctionValues;
    let outputObject = "";
    let selected = null;

    if (this.getSavedStereotypeSettings() != null) {
      selected = this.getSavedStereotypeSettings();
    }

    this.loadAllFunSSComputationGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelFunSSComputationGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its inputs and outputs would be highlighted
        this.FunSSComputationGroupsTasks.push({ groupId: this.selectedGroup, taskId: this.task.id });
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.getSavedStereotypeSettings() != null) {
      selectedGroupId = this.getGroup();
    } else {
      if (this.FunSSComputationGroupsTasks.length > 0) {
        selectedGroupId = this.FunSSComputationGroupsTasks[0].groupId;
      }
    }

    this.highlightFunSSComputationGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelFunSSComputationGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelFunSSComputationGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    for (let inputObject of this.getTaskInputObjects()) {
      let selectedEvaluationPoint = "";
      let selectedShareOfFunction = "";
      if (selected !== null) {
        if (inputObject.id == selected.evaluationPoint) {
          selectedEvaluationPoint = "selected";
        }
        if (inputObject.id == selected.shareOfFunction) {
          selectedShareOfFunction = "selected";
        }
      }
      evaluationPointValues += '<option ' + selectedEvaluationPoint + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      shareOfFunctionValues += '<option ' + selectedShareOfFunction + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of this.getFunSSComputationGroupTasks(selectedGroupId)) {
        if (groupTask.id != this.task.id) {
          let taskName = undefined;
          if (groupTask.businessObject.name) {
            taskName = groupTask.businessObject.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
          taskObjs += '<label class="text-16">' + taskName + '</label>'
          taskObjs += '<ul class="stereotype-option">';

          let evaluationPoint = undefined;
          if (groupTask.businessObject.FunSSComputation && JSON.parse(groupTask.businessObject.FunSSComputation).evaluationPoint && this.registry.get(JSON.parse(groupTask.businessObject.FunSSComputation).evaluationPoint)) {
            evaluationPoint = this.registry.get(JSON.parse(groupTask.businessObject.FunSSComputation).evaluationPoint).businessObject.name;
          }
          let shareOfFunction = undefined;
          if (groupTask.businessObject.FunSSComputation && JSON.parse(groupTask.businessObject.FunSSComputation).shareOfFunction && this.registry.get(JSON.parse(groupTask.businessObject.FunSSComputation).evaluationPoint)) {
            shareOfFunction = this.registry.get(JSON.parse(groupTask.businessObject.FunSSComputation).shareOfFunction).businessObject.name;
          }

          let taskInputs = '<label class="text-16">Evaluation point</label>';
          taskInputs += '<li>' + evaluationPoint + '</li>';
          taskInputs += '<label class="text-16">Share of function</label>';
          taskInputs += '<li>' + shareOfFunction + '</li>';

          let taskOutputs = '<label class="text-16">Output data</label>';
          for (let outputObj of this.getTaskHandlerByTaskId(groupTask.id).getTaskOutputObjects()) {
            taskOutputs += '<li>' + outputObj.businessObject.name + '</li>';
          }

          taskObjs += taskInputs;
          taskObjs += taskOutputs;
          taskObjs += '</ul>';

        }
      }
    }

    this.settingsPanelContainer.find('#FunSSComputation-groupSelect').html(groups);
    this.settingsPanelContainer.find('#FunSSComputation-evaluationPointSelect').html(evaluationPointValues);
    this.settingsPanelContainer.find('#FunSSComputation-shareOfFunctionSelect').html(shareOfFunctionValues);
    this.settingsPanelContainer.find('#FunSSComputation-outputObject').html(outputObject);
    this.settingsPanelContainer.find('#FunSSComputation-newGroup').html('');
    this.settingsPanelContainer.find('#FunSSComputation-otherGroupTasks').html('');
    this.settingsPanelContainer.find('#FunSSComputation-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllFunSSComputationGroupsAndTheirInputsOutputsHighlights();
    this.FunSSComputationGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let self = this;
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let currentStereotypeSettings = this.getCurrentStereotypeSettings();
      let group = currentStereotypeSettings.groupId;
      if (group) {
        let evaluationPoint = currentStereotypeSettings.evaluationPoint;
        let shareOfFunction = currentStereotypeSettings.shareOfFunction;
        let tasks = this.getFunSSComputationGroupTasks(group);
        let taskAlreadyInGroup = tasks.filter((obj) => {
          return obj.id == self.task.id;
        });
        if (tasks.length == 2 && taskAlreadyInGroup.length !== 1) {
          this.settingsPanelContainer.find('#FunSSComputation-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#FunSSComputation-groupSelect-help2').show();
          return;
        }
        if (evaluationPoint == shareOfFunction) {
          this.settingsPanelContainer.find('#FunSSComputation-conditions-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#FunSSComputation-evaluationPoint-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#FunSSComputation-shareOfFunction-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#FunSSComputation-conditions-help2').show();
          this.initRemoveButton();
          return;
        }
        if (this.getSavedStereotypeSettings() == null) {
          this.addStereotypeToElement();
        }
        this.setGroup(group);
        this.FunSSComputationGroupsTasks = $.grep(this.FunSSComputationGroupsTasks, (el, idx) => { return el.taskId == this.task.id }, true);
        this.FunSSComputationGroupsTasks.push({ groupId: group, taskId: this.task.id });
        for (let task of this.getFunSSComputationGroupTasks(group)) {
          if (task.id == this.task.id) {
            task.businessObject.FunSSComputation = JSON.stringify(currentStereotypeSettings);
          }
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        return true;
      } else {
        this.settingsPanelContainer.find('#FunSSComputation-groupSelect-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#FunSSComputation-groupSelect-help').show();
      }
    } else {
      this.settingsPanelContainer.find('#FunSSComputation-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#FunSSComputation-conditions-help').show();
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

  /** FunSSComputation class specific functions */
  init() {
    if (this.getSavedStereotypeSettings() != null) {
      this.setGroup(this.getSavedStereotypeSettings().groupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllFunSSComputationGroupsTasks() {
    this.FunSSComputationGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "FunSSComputation" && (<FunSSComputation>stereotype).getGroup() != null) {
          this.FunSSComputationGroupsTasks.push({ groupId: (<FunSSComputation>stereotype).getGroup(), taskId: stereotype.task.id });
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#FunSSComputation-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#FunSSComputation-newGroup').val();
      this.addFunSSComputationGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#FunSSComputation-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#FunSSComputation-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#FunSSComputation-groupSelect');
  }

  addFunSSComputationGroup(group: string) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#FunSSComputation-newGroup').val('');
      this.settingsPanelContainer.find('#FunSSComputation-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#FunSSComputation-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#FunSSComputation-newGroup-help').show();
    }
  }

  reloadStereotypeSettingsWithSelectedGroup(group: string) {
    // Create temporary object to save current stereotype group
    let tmpObj = { groupId: this.getGroup() };
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

  highlightFunSSComputationGroupMembersAndTheirInputsOutputs(group: string) {

    for (let i = 0; i < this.FunSSComputationGroupsTasks.length; i++) {
      let groupId = this.FunSSComputationGroupsTasks[i].groupId;
      let taskId = this.FunSSComputationGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getFunSSComputationGroupInputOutputObjects(groupId);

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

  removeAllFunSSComputationGroupsAndTheirInputsOutputsHighlights() {
    if (this.FunSSComputationGroupsTasks) {
      for (let i = 0; i < this.FunSSComputationGroupsTasks.length; i++) {
        let taskId = this.FunSSComputationGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getFunSSComputationGroupInputOutputObjects(this.FunSSComputationGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelFunSSComputationGroups() {
    let difGroups = [];
    for (let i = 0; i < this.FunSSComputationGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.FunSSComputationGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.FunSSComputationGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getFunSSComputationGroupTasks(group: string) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.FunSSComputationGroupsTasks, function (el, idx) { return el.groupId.trim() == group.trim() }, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getGroupOutputs(group: string) {
    this.init();
    this.loadAllFunSSComputationGroupsTasks();
    let groupTasks = this.getFunSSComputationGroupTasks(group);
    let outputs = [];
    for (let task of groupTasks) {
      outputs = outputs.concat(this.getTaskOutputObjectsByTaskId(task.id));
    }
    return outputs;
  }

  getFunSSComputationGroupInputOutputObjects(group: string) {
    let objects = [];
    if (this.FunSSComputationGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getFunSSComputationGroupTasks(group)) {
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
    let groupTasks = this.getFunSSComputationGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    if (groupTasksIds.length === 2) {
      groupTasksIds.splice(groupTasksIds.indexOf(this.task.id), 1);
      return groupTasksIds[0];
    }
    return null;
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: string) {
    // Inputs: if evaluationPoint - public, if shareOfFunction - private
    // Outputs: private
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      let savedData = this.getSavedStereotypeSettings();
      if (savedData.evaluationPoint == dataObjectId) {
        statuses.push("public-i");
      } else if (savedData.shareOfFunction == dataObjectId) {
        statuses.push("private-i");
      }
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

  areInputsFromTaskWithStereotypeAccepted(taskId: string) {
    // Accepted:
    // FunSSSharing
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.FunSSSharing) {
          return true;
        }
      }
    }
    return false;
  }

  areGroupTasksOnDifferentLanes() {
    let groupTasks = this.getFunSSComputationGroupTasks(this.getGroup());
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

  areGroupShareOfFunctionSharesDifferent() {
    if (this.getSavedStereotypeSettings().shareOfFunction && JSON.parse(this.registry.get(this.getGroupSecondElementId()).businessObject.FunSSComputation)) {
      let shareOfFunctionElementName = this.registry.get(this.getSavedStereotypeSettings().shareOfFunction).businessObject.name.trim();
      let secondGroupTaskShareOfFunctionElementName = this.registry.get(JSON.parse(this.registry.get(this.getGroupSecondElementId()).businessObject.FunSSComputation).shareOfFunction).businessObject.name.trim();
      if (shareOfFunctionElementName == secondGroupTaskShareOfFunctionElementName) {
        return false;
      }
      return true;
    }
    return false;
  }

  areGroupShareOfFunctionSharesFromSameOrigin() {
    if (this.getSavedStereotypeSettings().shareOfFunction && JSON.parse(this.registry.get(this.getGroupSecondElementId()).businessObject.FunSSComputation)) {
      let shareOfFunctionElementName = this.registry.get(this.getSavedStereotypeSettings().shareOfFunction).businessObject.name.trim();
      let secondGroupTaskShareOfFunctionElementName = this.registry.get(JSON.parse(this.registry.get(this.getGroupSecondElementId()).businessObject.FunSSComputation).shareOfFunction).businessObject.name.trim();
      let flag = false;
      for (let incTask of this.getTasksOfIncomingPath()) {
        if (this.isOneOfInputObjectsInTaskStereotypeOutputs(incTask, [this.registry.get(this.getSavedStereotypeSettings().shareOfFunction), this.registry.get(JSON.parse(this.registry.get(this.getGroupSecondElementId()).businessObject.FunSSComputation).shareOfFunction)]) && this.areInputsFromTaskWithStereotypeAccepted(incTask)) {
          let outputElementsNames = this.elementHandler.elementsHandler.getTaskHandlerByTaskId(incTask).getTaskOutputObjectsBasedOnTaskStereotype().map(a => a.businessObject.name.trim());
          if (outputElementsNames.indexOf(shareOfFunctionElementName) !== -1 && outputElementsNames.indexOf(secondGroupTaskShareOfFunctionElementName) !== -1) {
            flag = true;
          }
        }
      }
      if (!flag) {
        return false
      }
      return true;
    }
  }

  areEvaluationPointsSameForBothGroupTasks() {
    if (this.getSavedStereotypeSettings().evaluationPoint &&
      this.registry.get(this.getSavedStereotypeSettings().evaluationPoint) &&
      this.registry.get(this.getGroupSecondElementId()).businessObject.FunSSComputation &&
      JSON.parse(this.registry.get(this.getGroupSecondElementId()).businessObject.FunSSComputation).evaluationPoint &&
      this.registry.get(JSON.parse(this.registry.get(this.getGroupSecondElementId()).businessObject.FunSSComputation).evaluationPoint)) {
      let evaluationPointElementName = this.registry.get(this.getSavedStereotypeSettings().evaluationPoint).businessObject.name.trim();
      let secondGroupTaskEvaluationPointElementName = this.registry.get(JSON.parse(this.registry.get(this.getGroupSecondElementId()).businessObject.FunSSComputation).evaluationPoint).businessObject.name.trim();
      if (evaluationPointElementName != secondGroupTaskEvaluationPointElementName) {
        return false;
      }
      return true;
    }
    return false;
  }

  getFunSSComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
    let groupTasks = this.getFunSSComputationGroupTasks(this.getGroup());
    let problematicTasks = this.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
    for (let task of groupTasks) {
      if (problematicTasks.indexOf(task.id) !== -1) {
        return groupTasks.map(a => a.id);
      }
    }
    return [];
  }

  areFunSSComputationGroupsTasksInSameOrderOnAllPoolsAndLanes() {
    if (!this.areGroupsTasksInSameOrderOnAllPoolsAndLanes() && this.getFunSSComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes().length > 0) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllFunSSComputationGroupsTasks();

    let groupTasks = this.getFunSSComputationGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = this.getSavedStereotypeSettings();

    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: exactly 2 inputs and 1 output are required", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.evaluationPoint)) {
      this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: evaluationPoint object is missing", [this.task.id], []);
    }
    if (!this.taskHasInputElement(savedData.shareOfFunction)) {
      this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: shareOfFunction object is missing", [this.task.id], []);
    } else {
      if (savedData.evaluationPoint == savedData.shareOfFunction) {
        this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: evaluation point and function share must be different objects", [this.task.id], []);
      }
    }
    // If group has not enough or too many members
    if (groupTasks.length < 2) {
      this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: group must have exactly 2 members", groupTasksIds, []);
    } else {
      if (!this.areGroupTasksOnDifferentLanes()) {
        this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: both group tasks must be on separate lane", groupTasksIds, []);
      } else {
        if (!this.areTasksParallel(groupTasksIds)) {
          this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: group tasks must be parallel", groupTasksIds, []);
        } else {
          if (!this.areFunSSComputationGroupsTasksInSameOrderOnAllPoolsAndLanes()) {
            this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation warning: all group tasks are possibly not parallel", this.getFunSSComputationGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes(), []);
          }
          if (!this.isThereAtLeastOneStartEventInCurrentTaskProcess()) {
            this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation warning: StartEvent element is missing", [this.task.id], []);
          } else {
            if (!this.areAllGroupTasksAccesible()) {
              this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation warning: group task is possibly not accessible to the rest of the group", [this.task.id], []);
            }
          }
        }
      }
      if (!this.areGroupShareOfFunctionSharesFromSameOrigin()) {
        this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: both group input function shares must originate from the same task with FunSSSharing stereotype", groupTasksIds, []);
      } else {
        if (!this.areGroupShareOfFunctionSharesDifferent()) {
          this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: both group members must have different input function shares", groupTasksIds, []);
        }
      }
      if (!this.areEvaluationPointsSameForBothGroupTasks()) {
        this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: evaluation point must be the same (with same name) for both group members", groupTasksIds, []);
      }
    }
    // If groupId is undefined
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: groupId is undefined", [this.task.id], []);
    }
    // If evaluationPoint is undefined
    if (typeof savedData.evaluationPoint == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: evaluationPoint is undefined", [this.task.id], []);
    }
    // If shareOfFunction is undefined
    if (typeof savedData.shareOfFunction == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "FunSSComputation error: shareOfFunction is undefined", [this.task.id], []);
    }

  }

}