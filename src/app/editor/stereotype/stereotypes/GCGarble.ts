import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";
import { GCEvaluate } from "./GCEvaluate";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class GCGarble extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("GCGarble", taskHandler);
    this.init();
  }

  group: string = null;
  selectedGroup: string = null;
  GCGarbleAndEvaluateGroupsTasks: TaskStereotypeGroupObject[] = [];

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.GCGarble != null) {
      return JSON.parse(this.task.GCGarble);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // groupId
  // inputScript
  // garbledCircuit
  // inputEncoding
  getCurrentStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#GCGarble-groupSelect').val();
    let inputScript = this.settingsPanelContainer.find('#GCGarble-inputScript').val();
    let garbledCircuit = this.settingsPanelContainer.find('#GCGarble-garbledCircuitSelect').val();
    let inputEncoding = this.settingsPanelContainer.find('#GCGarble-inputEncodingSelect').val();
    return { groupId: group, inputScript: inputScript, garbledCircuit: garbledCircuit, inputEncoding: inputEncoding };
  }

  getGroup() {
    return this.group;
  }

  setGroup(name: string) {
    this.group = name;
  }

  initStereotypePublicView() {
    this.init();
    this.loadAllGCGarbleAndGCEvaluateGroupsTasks();
    super.initStereotypePublicView();
    this.highlightGCGarbleAndGCEvaluateGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    let selectedGroupId = null;
    let groups;
    let inputScript;
    let garbledCircuit;
    let inputEncoding;
    let selected = null;

    this.loadAllGCGarbleAndGCEvaluateGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelGCGarbleAndGCEvaluateGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its outputs would be highlighted
        this.GCGarbleAndEvaluateGroupsTasks.push({ groupId: this.selectedGroup, taskId: this.task.id });
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.getSavedStereotypeSettings() != null) {
      selectedGroupId = this.getGroup();
      selected = this.getSavedStereotypeSettings();
    } else {
      if (this.GCGarbleAndEvaluateGroupsTasks.length > 0) {
        selectedGroupId = this.GCGarbleAndEvaluateGroupsTasks[0].groupId;
      }
    }

    inputScript = this.getGCGarbleAndGCEvaluateGroupInputScript(selectedGroupId);
    this.highlightGCGarbleAndGCEvaluateGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelGCGarbleAndGCEvaluateGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelGCGarbleAndGCEvaluateGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      let selectedGarbledCircuit = "";
      let selectedInputEncoding = "";
      if (selected !== null) {
        if (outputObject.id == selected.garbledCircuit) {
          selectedGarbledCircuit = "selected";
        }
        if (outputObject.id == selected.inputEncoding) {
          selectedInputEncoding = "selected";
        }
      }
      garbledCircuit += '<option ' + selectedGarbledCircuit + ' value="' + outputObject.id + '">' + outputObject.businessObject.name + '</option>';
      inputEncoding += '<option ' + selectedInputEncoding + ' value="' + outputObject.id + '">' + outputObject.businessObject.name + '</option>';
    }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of this.getGCGarbleAndGCEvaluateGroupTasks(selectedGroupId)) {
        if (groupTask.id != this.task.id && groupTask.businessObject.GCEvaluate != null) {
          let taskName = undefined;
          if (groupTask.businessObject.name) {
            taskName = groupTask.businessObject.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
          taskObjs += '<label class="text-16">' + taskName + '</label>'
          taskObjs += '<ul class="stereotype-option">';

          let taskInputs = '<label class="text-16">Garbled circuit</label>';
          taskInputs += '<li>' + this.registry.get(JSON.parse(groupTask.businessObject.GCEvaluate).garbledCircuit).businessObject.name + '</li>';
          taskInputs += '<label class="text-16">Input encoding</label>';
          taskInputs += '<li>' + this.registry.get(JSON.parse(groupTask.businessObject.GCEvaluate).inputEncoding).businessObject.name + '</li>';

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

    this.settingsPanelContainer.find('#GCGarble-groupSelect').html(groups);
    this.settingsPanelContainer.find('#GCGarble-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#GCGarble-garbledCircuitSelect').html(garbledCircuit);
    this.settingsPanelContainer.find('#GCGarble-inputEncodingSelect').html(inputEncoding);
    this.settingsPanelContainer.find('#GCGarble-newGroup').html('');
    this.settingsPanelContainer.find('#GCGarble-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllGCGarbleAndGCEvaluateGroupsAndTheirInputsOutputsHighlights();
    this.GCGarbleAndEvaluateGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let self = this;
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let currentStereotypeSettings = this.getCurrentStereotypeSettings();
      let group = currentStereotypeSettings.groupId;
      if (group) {
        let inputScript = currentStereotypeSettings.inputScript;
        let garbledCircuit = currentStereotypeSettings.garbledCircuit;
        let inputEncoding = currentStereotypeSettings.inputEncoding;
        let tasks = this.getGCGarbleAndGCEvaluateGroupTasks(group);
        let taskAlreadyInGroup = tasks.filter((obj) => {
          return obj.id == self.task.id;
        });
        if (tasks.length === 2 && taskAlreadyInGroup.length !== 1) {
          this.settingsPanelContainer.find('#GCGarble-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#GCGarble-groupSelect-help2').show();
          return;
        } else if (tasks.length === 1) {
          for (let task of tasks) {
            if (task.businessObject.GCGarble != null && task.id != this.task.id) {
              this.settingsPanelContainer.find('#GCGarble-groupSelect-form-group').addClass('has-error');
              this.settingsPanelContainer.find('#GCGarble-groupSelect-help2').show();
              return;
            }
          }
        }
        if (garbledCircuit == inputEncoding) {
          this.settingsPanelContainer.find('#GCGarble-conditions-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#GCGarble-garbledCircuit-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#GCGarble-inputEncoding-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#GCGarble-conditions-help2').show();
          this.initRemoveButton();
          return;
        }
        if (this.getSavedStereotypeSettings() == null) {
          this.addStereotypeToElement();
        }
        this.setGroup(group);
        this.GCGarbleAndEvaluateGroupsTasks = $.grep(this.GCGarbleAndEvaluateGroupsTasks, (el, idx) => { return el.taskId == this.task.id }, true);
        this.GCGarbleAndEvaluateGroupsTasks.push({ groupId: group, taskId: this.task.id });
        for (let task of this.getGCGarbleAndGCEvaluateGroupTasks(group)) {
          if (task.id == this.task.id) {
            task.businessObject.GCGarble = JSON.stringify(currentStereotypeSettings);
          } else {
            task.businessObject.GCEvaluate = JSON.stringify({ groupId: group, inputScript: inputScript, garbledCircuit: JSON.parse(task.businessObject.GCEvaluate).garbledCircuit, inputEncoding: JSON.parse(task.businessObject.GCEvaluate).inputEncoding });
          }
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        return true;
      } else {
        this.settingsPanelContainer.find('#GCGarble-groupSelect-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#GCGarble-groupSelect-help').show();
      }
    } else {
      this.settingsPanelContainer.find('#GCGarble-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#GCGarble-conditions-help').show();
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

  /** GCGarble class specific functions */
  init() {
    if (this.getSavedStereotypeSettings() != null) {
      this.setGroup(this.getSavedStereotypeSettings().groupId);
    }
  }

  loadAllGCGarbleAndGCEvaluateGroupsTasks() {
    this.GCGarbleAndEvaluateGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "GCGarble" && (<GCGarble>stereotype).getGroup() != null) {
          this.GCGarbleAndEvaluateGroupsTasks.push({ groupId: (<GCGarble>stereotype).getGroup(), taskId: stereotype.task.id });
        }
        if (stereotype.getTitle() == "GCEvaluate" && (<GCEvaluate>stereotype).getGroup() != null) {
          this.GCGarbleAndEvaluateGroupsTasks.push({ groupId: (<GCEvaluate>stereotype).getGroup(), taskId: stereotype.task.id });
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#GCGarble-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#GCGarble-newGroup').val();
      this.addGCGarbleGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#GCGarble-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#GCGarble-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#GCGarble-groupSelect');
  }

  addGCGarbleGroup(group: string) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#GCGarble-newGroup').val('');
      this.settingsPanelContainer.find('#GCGarble-inputScript').val('');
      this.settingsPanelContainer.find('#GCGarble-garbledCircuitSelect').val('');
      this.settingsPanelContainer.find('#GCGarble-inputEncodingSelect').val('');
      this.settingsPanelContainer.find('#GCGarble-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#GCGarble-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#GCGarble-newGroup-help').show();
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

  highlightGCGarbleAndGCEvaluateGroupMembersAndTheirInputsOutputs(group: string) {

    for (let i = 0; i < this.GCGarbleAndEvaluateGroupsTasks.length; i++) {
      let groupId = this.GCGarbleAndEvaluateGroupsTasks[i].groupId;
      let taskId = this.GCGarbleAndEvaluateGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getGCGarbleAndGCEvaluateGroupInputOutputObjects(groupId);

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

  removeAllGCGarbleAndGCEvaluateGroupsAndTheirInputsOutputsHighlights() {
    if (this.GCGarbleAndEvaluateGroupsTasks) {
      for (let i = 0; i < this.GCGarbleAndEvaluateGroupsTasks.length; i++) {
        let taskId = this.GCGarbleAndEvaluateGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getGCGarbleAndGCEvaluateGroupInputOutputObjects(this.GCGarbleAndEvaluateGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelGCGarbleAndGCEvaluateGroups() {
    let difGroups = [];
    for (let i = 0; i < this.GCGarbleAndEvaluateGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.GCGarbleAndEvaluateGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.GCGarbleAndEvaluateGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getGCGarbleAndGCEvaluateGroupTasks(group: string) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.GCGarbleAndEvaluateGroupsTasks, function (el, idx) { return el.groupId.trim() == group.trim() }, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getGCGarbleAndGCEvaluateGroupInputOutputObjects(group: string) {
    let objects = [];
    if (this.GCGarbleAndEvaluateGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getGCGarbleAndGCEvaluateGroupTasks(group)) {
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

  getGCGarbleAndGCEvaluateGroupInputScript(group: string) {
    let script = "";
    if (group != null) {
      let groupTasks = this.getGCGarbleAndGCEvaluateGroupTasks(group);
      if (groupTasks.length === 1) {
        if (groupTasks[0].businessObject.GCGarble) {
          script = JSON.parse(groupTasks[0].businessObject.GCGarble).inputScript;
        }
      } else {
        for (let groupTask of groupTasks) {
          if (groupTask.id != this.task.id && groupTask.businessObject.GCEvaluate != null) {
            script = JSON.parse(groupTask.businessObject.GCEvaluate).inputScript;
            break;
          }
          if (groupTask.id != this.task.id && groupTask.businessObject.GCGarble != null) {
            script = JSON.parse(groupTask.businessObject.GCGarble).inputScript;
            break;
          }
        }
      }
    }
    return script;
  }

  getMessageFlowsOfOutgoingPath() {
    let outgMessageFlows = [];
    let outgoingTasks = this.getTasksOfOutgoingPath();
    for (let el of this.task.$parent.$parent.rootElements) {
      if (el.$type === "bpmn:Collaboration") {
        if (el.messageFlows) {
          for (let mF of el.messageFlows) {
            if (mF.sourceRef.$type === "bpmn:Task" && (outgoingTasks.indexOf(mF.sourceRef.id) !== -1 || this.task.id == mF.sourceRef.id)) {
              outgMessageFlows.push(mF.id)
            }
          }
        }
      }
    }
    return $.unique(outgMessageFlows);
  }

  getGroupSecondElementId() {
    let groupTasks = this.getGCGarbleAndGCEvaluateGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    if (groupTasksIds.length === 2) {
      groupTasksIds.splice(groupTasksIds.indexOf(this.task.id), 1);
      return groupTasksIds[0];
    }
    return null;
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: string) {
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
    // Inputs: exactly 0
    // Outputs: exactly 2
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 0 || numberOfOutputs != 2) {
      return false;
    }
    return true;
  }

  areGroupTasksOnDifferentLanes() {
    let groupTasks = this.getGCGarbleAndGCEvaluateGroupTasks(this.getGroup());
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

  isGarbledCircuitSameForBothGCGarbleAndGCEvaluateGroupMembers() {
    let GCEvaluateElementId = this.getGroupSecondElementId();
    let GCEvaluateElement = this.registry.get(GCEvaluateElementId);
    let GCGarbleElement = this.getSavedStereotypeSettings();
    if (GCEvaluateElement && GCGarbleElement) {
      let GCEvaluateElementGarbledCircuit = JSON.parse(GCEvaluateElement.businessObject.GCEvaluate).garbledCircuit;
      let GCGarbleElementGarbledCircuit = GCGarbleElement.garbledCircuit;
      if (GCEvaluateElementGarbledCircuit && GCGarbleElementGarbledCircuit) {
        let GCEvaluateGarbledCircuitElement = this.registry.get(GCEvaluateElementGarbledCircuit);
        let GCGarbleGarbledCircuitElement = this.registry.get(GCGarbleElementGarbledCircuit);
        if (GCEvaluateGarbledCircuitElement.businessObject.name.trim() !== GCGarbleGarbledCircuitElement.businessObject.name.trim()) {
          return false;
        }
      }
      return true;
    }
  }

  areStereotypesInCorrectOrder() {
    return this.taskIsInOutgoingPath(this.getGroupSecondElementId()) && !this.taskIsInIncomingPath(this.getGroupSecondElementId());
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllGCGarbleAndGCEvaluateGroupsTasks();

    let groupTasks = this.getGCGarbleAndGCEvaluateGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = this.getSavedStereotypeSettings();

    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "GCGarble error: exactly 2 outputs and no inputs are required", [this.task.id], []);
    }
    if (!this.taskHasOutputElement(savedData.garbledCircuit)) {
      this.addUniqueErrorToErrorsList(existingErrors, "GCGarble error: garbledCircuit object is missing", [this.task.id], []);
    }
    if (!this.taskHasOutputElement(savedData.inputEncoding)) {
      this.addUniqueErrorToErrorsList(existingErrors, "GCGarble error: inputEncoding object is missing", [this.task.id], []);
    } else {
      if (savedData.garbledCircuit == savedData.inputEncoding) {
        this.addUniqueErrorToErrorsList(existingErrors, "GCGarble error: garbledCircuit and inputEncoding must be different objects", [this.task.id], []);
      }
    }
    if (groupTasks.length < 2) {
      this.addUniqueErrorToErrorsList(existingErrors, "GCGarble error: element with GCEvaluate stereotype is missing from the group", [this.task.id], []);
    } else {
      if (this.taskHasOutputElement(savedData.garbledCircuit)) {
        if (!this.isGarbledCircuitSameForBothGCGarbleAndGCEvaluateGroupMembers()) {
          this.addUniqueErrorToErrorsList(existingErrors, "GCGarble & GCEvaluate error: garbledCircuit objects must be same for both group members", groupTasksIds, []);
        }
      }
      if (!this.areGroupTasksOnDifferentLanes()) {
        this.addUniqueErrorToErrorsList(existingErrors, "GCGarble & GCEvaluate error: both group tasks must be on separate lane", groupTasksIds, []);
      }
      if (!this.areStereotypesInCorrectOrder()) {
        this.addUniqueErrorToErrorsList(existingErrors, "GCGarble & GCEvaluate error: element with GCGarble stereotype in this group must be before element with GCEvaluate stereotype", groupTasksIds, []);
      }
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "GCGarble error: groupId is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputScript == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "GCGarble error: inputScript is undefined", [this.task.id], []);
    }
    if (typeof savedData.garbledCircuit == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "GCGarble error: garbledCircuit is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputEncoding == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "GCGarble error: inputEncoding is undefined", [this.task.id], []);
    }
  }

}