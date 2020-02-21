import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare let $: any;
declare let CodeMirror: any;

let inputScriptCodeMirror;

export class MPC extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("MPC", taskHandler);
    this.init();
  }

  group: string = null;
  selectedGroup: string = null;
  MPCGroupsTasks: TaskStereotypeGroupObject[] = [];

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.MPC != null) {
      return JSON.parse(this.task.MPC);
    } else {
      return null;
    }
  }

  getSavedStereotypeScript() {
    return this.task.sqlScript != null ? this.task.sqlScript : "";
  }

  // Returns an object with properties:
  // groupId
  // inputScript
  getCurrentStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#MPC-groupSelect').val();
    let inputScript = this.getSavedStereotypeSettings() ? this.getSavedStereotypeSettings().inputScript : ""; // this.settingsPanelContainer.find('#MPC-inputScript').val();
    return { groupId: group, inputScript: inputScript };
  }

  getGroup() {
    return this.group;
  }

  setGroup(name: string) {
    this.group = name;
  }

  initStereotypePublicView() {
    this.init();
    this.loadAllMPCGroupsTasks();
    super.initStereotypePublicView();
    this.highlightMPCGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    let selectedGroupId = null;
    let groups;
    let inputObjects = "";
    let outputObjects = "";
    let inputScript = this.getSavedStereotypeScript();

    this.loadAllMPCGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelMPCGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its inputs and outputs would be highlighted
        this.MPCGroupsTasks.push({ groupId: this.selectedGroup, taskId: this.task.id });
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.getSavedStereotypeSettings() != null) {
      selectedGroupId = this.getGroup();
    } else {
      if (this.MPCGroupsTasks.length > 0) {
        selectedGroupId = this.MPCGroupsTasks[0].groupId;
      }
    }

    // inputScript = this.getMPCGroupInputScript(selectedGroupId);
    this.highlightMPCGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelMPCGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelMPCGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
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
      for (let groupTask of this.getMPCGroupTasks(selectedGroupId)) {
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

    this.settingsPanelContainer.find('#MPC-groupSelect').html(groups);
    this.settingsPanelContainer.find('#MPC-inputScript').val(inputScript);
    if (inputScriptCodeMirror) {
      inputScriptCodeMirror.toTextArea();
    }
    inputScriptCodeMirror = CodeMirror.fromTextArea(document.getElementById("MPC-inputScript"), {
      mode: "text/x-mysql",
      readOnly: true,
      lineNumbers: false,
      showCursorWhenSelecting: true,
      lineWiseCopyCut: false,
      height: 100
    });
    setTimeout(() => {
      inputScriptCodeMirror.refresh();
    }, 10);

    this.settingsPanelContainer.find('#MPC-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#MPC-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#MPC-newGroup').html('');
    this.settingsPanelContainer.find('#MPC-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    if (inputScriptCodeMirror) {
      inputScriptCodeMirror.toTextArea();
    }
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllMPCGroupsAndTheirInputsOutputsHighlights();
    this.MPCGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let currentStereotypeSettings = this.getCurrentStereotypeSettings();
    let group = currentStereotypeSettings.groupId;
    if (group) {
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.setGroup(group);
      this.MPCGroupsTasks = $.grep(this.MPCGroupsTasks, (el, idx) => { return el.taskId == this.task.id }, true);
      this.MPCGroupsTasks.push({ groupId: group, taskId: this.task.id });
      for (let task of this.getMPCGroupTasks(group)) {
        task.businessObject.MPC = JSON.stringify(currentStereotypeSettings);
      }
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#MPC-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#MPC-groupSelect-help').show();
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

  /** MPC class specific functions */
  init() {
    if (this.getSavedStereotypeSettings() != null) {
      this.setGroup(this.getSavedStereotypeSettings().groupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllMPCGroupsTasks() {
    this.MPCGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "MPC" && (<MPC>stereotype).getGroup() != null) {
          this.MPCGroupsTasks.push({ groupId: (<MPC>stereotype).getGroup(), taskId: stereotype.task.id });
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#MPC-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#MPC-newGroup').val();
      this.addMPCGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#MPC-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#MPC-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#MPC-groupSelect');
  }

  addMPCGroup(group: string) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#MPC-newGroup').val('');
      this.settingsPanelContainer.find('#MPC-inputScript').val('');
      this.settingsPanelContainer.find('#MPC-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#MPC-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#MPC-newGroup-help').show();
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

  highlightMPCGroupMembersAndTheirInputsOutputs(group: string) {

    for (let i = 0; i < this.MPCGroupsTasks.length; i++) {
      let groupId = this.MPCGroupsTasks[i].groupId;
      let taskId = this.MPCGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getMPCGroupInputOutputObjects(groupId);

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

  removeAllMPCGroupsAndTheirInputsOutputsHighlights() {
    if (this.MPCGroupsTasks) {
      for (let i = 0; i < this.MPCGroupsTasks.length; i++) {
        let taskId = this.MPCGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getMPCGroupInputOutputObjects(this.MPCGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelMPCGroups() {
    let difGroups = [];
    for (let i = 0; i < this.MPCGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.MPCGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.MPCGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getMPCGroupTasks(group: string) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.MPCGroupsTasks, function (el, idx) { return el.groupId.trim() == group.trim() }, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getMPCGroupInputOutputObjects(group: string) {
    let objects = [];
    if (this.MPCGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getMPCGroupTasks(group)) {
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

  // getMPCGroupInputScript(group: string) {
  //   let script = "";
  //   if (group != null) {
  //     let groupTasks = this.getMPCGroupTasks(group);
  //     if (groupTasks.length === 1) {
  //       if (groupTasks[0].businessObject.MPC) {
  //         script = JSON.parse(groupTasks[0].businessObject.MPC).inputScript;
  //       }
  //     } else {
  //       for (let groupTask of groupTasks) {
  //         if (groupTask.id != this.task.id) {
  //           script = JSON.parse(groupTask.businessObject.MPC).inputScript;
  //           break;
  //         }
  //       }
  //     }
  //   }
  //   return script;
  // }

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
  getNumberOfMPCGroupInputs() {
    let groupTasks = this.getMPCGroupTasks(this.getGroup());
    let numberOfgroupInputs = 0;
    for (let task of groupTasks) {
      let numberOfTaskInputs = this.getTaskInputObjectsByTaskId(task.id).length;
      numberOfgroupInputs += numberOfTaskInputs;
    }
    return numberOfgroupInputs;
  }

  getNumberOfMPCGroupOutputs() {
    let groupTasks = this.getMPCGroupTasks(this.getGroup());
    let numberOfGroupOutputs = 0;
    for (let task of groupTasks) {
      let numberOfTaskOutputs = this.getTaskOutputObjectsByTaskId(task.id).length;
      numberOfGroupOutputs += numberOfTaskOutputs;
    }
    return numberOfGroupOutputs;
  }

  areGroupTasksOnDifferentLanes() {
    let groupTasks = this.getMPCGroupTasks(this.getGroup());
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

  getMPCGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
    let groupTasks = this.getMPCGroupTasks(this.getGroup());
    let problematicTasks = this.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
    for (let task of groupTasks) {
      if (problematicTasks.indexOf(task.id) !== -1) {
        return groupTasks.map(a => a.id);
      }
    }
    return [];
  }

  areMPCGroupsTasksInSameOrderOnAllPoolsAndLanes() {
    if (!this.areGroupsTasksInSameOrderOnAllPoolsAndLanes() && this.getMPCGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes().length > 0) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllMPCGroupsTasks();

    let groupTasks = this.getMPCGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = this.getSavedStereotypeSettings();

    // If group has no inputs or outputs
    if (this.getNumberOfMPCGroupInputs() == 0 || this.getNumberOfMPCGroupOutputs() == 0) {
      this.addUniqueErrorToErrorsList(existingErrors, "MPC error: group must have at least 1 input and 1 output object", groupTasksIds, []);
    }
    // If group has not enough members
    if (groupTasks.length < 2) {
      this.addUniqueErrorToErrorsList(existingErrors, "MPC error: group must have at least 2 members", groupTasksIds, []);
    } else {
      if (!this.areGroupTasksOnDifferentLanes()) {
        this.addUniqueErrorToErrorsList(existingErrors, "MPC error: each group task must be on separate lane", groupTasksIds, []);
      } else {
        if (!this.areTasksParallel(groupTasksIds)) {
          this.addUniqueErrorToErrorsList(existingErrors, "MPC error: all group tasks must be parallel", groupTasksIds, []);
        } else {
          if (!this.areMPCGroupsTasksInSameOrderOnAllPoolsAndLanes()) {
            this.addUniqueErrorToErrorsList(existingErrors, "MPC warning: all group tasks are possibly not parallel", this.getMPCGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes(), []);
          }
          if (!this.isThereAtLeastOneStartEventInCurrentTaskProcess()) {
            this.addUniqueErrorToErrorsList(existingErrors, "MPC warning: StartEvent element is missing", [this.task.id], []);
          } else {
            if (!this.areAllGroupTasksAccesible()) {
              this.addUniqueErrorToErrorsList(existingErrors, "MPC warning: group task is possibly not accessible to the rest of the group", [this.task.id], []);
            }
          }
        }
      }
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "MPC error: groupId is undefined", [this.task.id], []);
    }
    if (typeof savedData.inputScript == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "MPC error: inputScript is undefined", [this.task.id], []);
    }
  }

}