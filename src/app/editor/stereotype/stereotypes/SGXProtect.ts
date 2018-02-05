import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";
import { SGXComputation } from "./SGXComputation";
import { SGXAttestationEnclave } from "./SGXAttestationEnclave";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SGXProtect extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXProtect", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  SGXProtectGroupsTasks: TaskStereotypeGroupObject[] = [];

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
    this.loadAllSGXProtectGroupsTasks();
    super.initStereotypePublicView();
    this.highlightSGXProtectGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    let selectedGroupId = null;
    let groups;
    let inputObjects = "";
    let outputObjects = "";

    this.loadAllSGXProtectGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelSGXProtectGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its inputs and outputs would be highlighted
        this.SGXProtectGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.task.SGXProtect != null) {
      selectedGroupId = this.getGroup();
    } else {
      if (this.SGXProtectGroupsTasks.length > 0) {
        selectedGroupId = this.SGXProtectGroupsTasks[0].groupId;
      }
    }

    this.highlightSGXProtectGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelSGXProtectGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelSGXProtectGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    for (let inputObject of this.getTaskInputObjects()) {
      inputObjects += '<li>' + inputObject.businessObject.name + '</li>';
    }

    for (let outputObject of this.getTaskOutputObjects()) {
      outputObjects += '<li>' + outputObject.businessObject.name + '</li>'; // SGXPrivate
    }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of this.getSGXProtectGroupTasks(selectedGroupId)) {
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

    this.settingsPanelContainer.find('#SGXProtect-taskName').text(this.task.name);
    this.settingsPanelContainer.find('#SGXProtect-groupSelect').html(groups);
    this.settingsPanelContainer.find('#SGXProtect-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SGXProtect-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#SGXProtect-newGroup').html('');
    this.settingsPanelContainer.find('#SGXProtect-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllSGXProtectGroupsAndTheirInputsOutputsHighlights();
    this.SGXProtectGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#SGXProtect-groupSelect').val();
    if (group) {
      if (this.areInputsAndOutputsNumbersCorrect()) {
        if (this.task.SGXProtect == null) {
          this.addStereotypeToElement();
        }
        this.setGroup(group);
        this.SGXProtectGroupsTasks = $.grep(this.SGXProtectGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
        this.SGXProtectGroupsTasks.push({groupId: group, taskId: this.task.id});
        this.task.SGXProtect = JSON.stringify({groupId: group});
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        super.saveStereotypeSettings();
      } else {
        this.settingsPanelContainer.find('#SGXProtect-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXProtect-conditions-help').show();
        this.initSaveAndRemoveButtons();
      }
    } else {
      this.settingsPanelContainer.find('#SGXProtect-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXProtect-groupSelect-help').show();
    }
  }

  removeStereotype() {
    super.removeStereotype();
  }

  /** SGXProtect class specific functions */
  init() {
    if (this.task.SGXProtect != null) {
      this.setGroup(JSON.parse(this.task.SGXProtect).groupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllSGXProtectGroupsTasks() {
    this.SGXProtectGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "SGXProtect" && (<SGXProtect>stereotype).getGroup() != null) {
          this.SGXProtectGroupsTasks.push({groupId: (<SGXProtect>stereotype).getGroup(), taskId: stereotype.task.id});
        }
        if (stereotype.getTitle() == "SGXComputation" && (<SGXComputation>stereotype).getGroup() != null) {
            this.SGXProtectGroupsTasks.push({groupId: (<SGXComputation>stereotype).getGroup(), taskId: stereotype.task.id});
          }
        if (stereotype.getTitle() == "SGXAttestationEnclave" && (<SGXAttestationEnclave>stereotype).getSGXGroup() != null && (<SGXAttestationEnclave>stereotype).getSGXGroup() != "") {
          this.SGXProtectGroupsTasks.push({groupId: (<SGXAttestationEnclave>stereotype).getSGXGroup(), taskId: stereotype.task.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#SGXProtect-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#SGXProtect-newGroup').val();
      this.addSGXProtectGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#SGXProtect-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#SGXProtect-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#SGXProtect-groupSelect');
  }

  addSGXProtectGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#SGXProtect-newGroup').val('');
      this.settingsPanelContainer.find('#SGXProtect-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#SGXProtect-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXProtect-newGroup-help').show();
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

  highlightSGXProtectGroupMembersAndTheirInputsOutputs(group: String) {

    for (let i = 0; i < this.SGXProtectGroupsTasks.length; i++) {
      let groupId = this.SGXProtectGroupsTasks[i].groupId;
      let taskId = this.SGXProtectGroupsTasks[i].taskId;

      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getSGXProtectGroupInputOutputObjects(groupId);

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

  removeAllSGXProtectGroupsAndTheirInputsOutputsHighlights() {
    if (this.SGXProtectGroupsTasks) {
      for (let i = 0; i < this.SGXProtectGroupsTasks.length; i++) {
        let taskId = this.SGXProtectGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getSGXProtectGroupInputOutputObjects(this.SGXProtectGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelSGXProtectGroups() {
    let difGroups = [];
    for (let i = 0; i < this.SGXProtectGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.SGXProtectGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.SGXProtectGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getSGXProtectGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.SGXProtectGroupsTasks, function(el, idx) {return el.groupId.trim() == group.trim()}, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getSGXProtectGroupInputOutputObjects(group: String) {
    let objects = [];
    if (this.SGXProtectGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getSGXProtectGroupTasks(group)) {
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

  getNumberOfSGXProtectGroupInputs() {
    let groupTasks = this.getSGXProtectGroupTasks(this.getGroup());
    let numberOfgroupInputs = 0;
    for (let task of groupTasks) {
      let numberOfTaskInputs = this.getTaskInputObjectsByTaskId(task.id).length;
      numberOfgroupInputs += numberOfTaskInputs;
    }
    return numberOfgroupInputs;
  }

  getNumberOfSGXProtectGroupOutputs() {
    let groupTasks = this.getSGXProtectGroupTasks(this.getGroup());
    let numberOfGroupOutputs = 0;
    for (let task of groupTasks) {
      let numberOfTaskOutputs = this.getTaskOutputObjectsByTaskId(task.id).length;
      numberOfGroupOutputs += numberOfTaskOutputs;
    }
    return numberOfGroupOutputs;
  }

  /** Simple disclosure analysis functions */
  getDataObjectVisibilityStatus(dataObjectId: String) {
    // Inputs: public
    // Outputs: private
    let statuses = [];
    let inputIds = this.getTaskInputObjects().map(a => a.id);
    let outputIds = this.getTaskOutputObjects().map(a => a.id);
    if (inputIds.indexOf(dataObjectId) !== -1) {
      if (this.task.SGXComputation != null) {
        let savedData = JSON.parse(this.task.SGXComputation);
        if (savedData.inputScript.type == "stereotype") {
          return this.getTaskHandlerByTaskId(this.task.id).getTaskStereotypeInstanceByName("SGXComputation").getDataObjectVisibilityStatus(dataObjectId);
        }
      }
      statuses.push("public-i");
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
    // Inputs: exactly 1
    // Outputs: exactly 1
    let numberOfInputs = this.getTaskInputObjects().length;
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfInputs != 1 || numberOfOutputs != 1) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllSGXProtectGroupsTasks();

    let groupTasks = this.getSGXProtectGroupTasks(this.getGroup());
    let groupTasksIds = groupTasks.map(a => a.id);
    let savedData = JSON.parse(this.task.SGXProtect);
    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXProtect error: exactly 1 input and 1 output are required", [this.task.id], []);
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXProtect error: groupId is undefined", [this.task.id], []);
    }
  }

}