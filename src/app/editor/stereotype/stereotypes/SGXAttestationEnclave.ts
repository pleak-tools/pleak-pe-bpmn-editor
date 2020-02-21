import { ValidationErrorObject } from "../../handler/validation-handler";
import { TaskStereotype, TaskStereotypeGroupObject } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";
import { SGXAttestationChallenge } from "./SGXAttestationChallenge";
import { SGXComputation } from "./SGXComputation";
import { SGXProtect } from "./SGXProtect";

declare let $: any;

export class SGXAttestationEnclave extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXAttestationEnclave", taskHandler);
    this.init();
  }

  group: string = null;
  SGXgroup: string = null;
  selectedGroup: string = null;
  selectedSGXGroup: string = null;
  SGXAttestationEnclaveAndEvaluateGroupsTasks: TaskStereotypeGroupObject[] = [];
  SGXComputationGroupsTasks: TaskStereotypeGroupObject[] = [];
  groupsTempInfo: any = null;

  /** Functions inherited from TaskStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.task.SGXAttestationEnclave != null) {
      return JSON.parse(this.task.SGXAttestationEnclave);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // groupId
  // SGXgroupId
  getCurrentStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#SGXAttestationEnclave-groupSelect').val();
    let SGXGroup = this.settingsPanelContainer.find('#SGXAttestationEnclave-SGXComputation-groupSelect').val();
    return { groupId: group, SGXgroupId: SGXGroup }
  }

  getGroup() {
    return this.group;
  }

  getSGXGroup() {
    return this.SGXgroup;
  }

  setGroup(name: string) {
    this.group = name;
  }

  setSGXGroup(name: string) {
    this.SGXgroup = name;
  }

  initStereotypePublicView() {
    this.init();
    this.loadAllSGXAttestationGroupsTasks();
    this.loadAllSGXComputationGroupsTasks();
    super.initStereotypePublicView();
    this.highlightSGXAttestationGroupMembersAndTheirInputsOutputs(this.getGroup());
    this.highlightSGXComputationGroupMembersAndTheirInputsOutputs(this.getSGXGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButtons();
    this.initGroupSelectDropdowns();

    let selectedGroupId = null;
    let selectedSGXGroupId = null;
    let groups;
    let SGXgroups;
    let inputObject = ""

    this.loadAllSGXAttestationGroupsTasks();
    this.loadAllSGXComputationGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelSGXAttestationGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its outputs would be highlighted
        this.SGXAttestationEnclaveAndEvaluateGroupsTasks.push({ groupId: this.selectedGroup, taskId: this.task.id });
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.getSavedStereotypeSettings() != null) {
      selectedGroupId = this.getGroup();
    } else {
      if (this.SGXAttestationEnclaveAndEvaluateGroupsTasks.length > 0) {
        selectedGroupId = this.SGXAttestationEnclaveAndEvaluateGroupsTasks[0].groupId;
      }
    }
    if (this.selectedSGXGroup != null) {
      if (this.selectedSGXGroup != "" && this.getModelSGXComputationGroups().indexOf(this.selectedSGXGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its outputs would be highlighted
        this.SGXComputationGroupsTasks.push({ groupId: this.selectedSGXGroup, taskId: this.task.id });
      }
      selectedSGXGroupId = this.selectedSGXGroup;
    } else if (this.getSavedStereotypeSettings() != null) {
      selectedSGXGroupId = this.getSGXGroup();
    }

    if (selectedGroupId) {
      this.highlightSGXAttestationGroupMembersAndTheirInputsOutputs(selectedGroupId);
    }
    if (selectedSGXGroupId) {
      this.highlightSGXComputationGroupMembersAndTheirInputsOutputs(selectedSGXGroupId);
    }

    for (let group of this.getModelSGXAttestationGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (selectedSGXGroupId == "") {
      SGXgroups += '<option selected value="">Not selected</option>';
    } else {
      SGXgroups += '<option value="">Not selected</option>';
    }
    for (let SGXgroup of this.getModelSGXComputationGroups()) {
      let sel = "";
      if (selectedSGXGroupId !== null) {
        if (SGXgroup == selectedSGXGroupId && selectedSGXGroupId != "") {
          sel = "selected";
        }
      }
      SGXgroups += '<option ' + sel + ' value="' + SGXgroup + '">' + SGXgroup + '</option>';
    }

    if (this.getModelSGXAttestationGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    if (this.getModelSGXComputationGroups().indexOf(this.selectedSGXGroup) === -1 && this.selectedSGXGroup != null && this.selectedSGXGroup != "") {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      SGXgroups += '<option selected value="' + this.selectedSGXGroup + '">' + this.selectedSGXGroup + '</option>';
    }

    for (let inputObj of this.getTaskInputObjects()) {
      inputObject += '<li>' + inputObj.businessObject.name + '</li>';
    }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of this.getSGXAttestationGroupTasks(selectedGroupId)) {
        if (groupTask.id != this.task.id && groupTask.businessObject.SGXAttestationChallenge != null) {
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

    let SGXtaskObjs = "";
    if (selectedSGXGroupId !== null) {
      for (let groupTask of this.getSGXComputationGroupTasks(selectedSGXGroupId)) {
        if (groupTask.id != this.task.id) {
          let taskName = undefined;
          if (groupTask.businessObject.name) {
            taskName = groupTask.businessObject.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
          SGXtaskObjs += '<label class="text-16">' + taskName + '</label>'
          SGXtaskObjs += '<ul class="stereotype-option">';

          let taskInputs = '<label class="text-16">Input data objects</label>';
          let taskOutputs = '<label class="text-16">Output data</label>';

          for (let inputObj of this.getTaskHandlerByTaskId(groupTask.id).getTaskInputObjects()) {
            taskInputs += '<li>' + inputObj.businessObject.name + '</li>';
          }
          for (let outputObj of this.getTaskHandlerByTaskId(groupTask.id).getTaskOutputObjects()) {
            taskOutputs += '<li>' + outputObj.businessObject.name + '</li>';
          }

          SGXtaskObjs += taskInputs;
          SGXtaskObjs += taskOutputs;
          SGXtaskObjs += '</ul>';

        }
      }
    }

    this.settingsPanelContainer.find('#SGXAttestationEnclave-groupSelect').html(groups);
    this.settingsPanelContainer.find('#SGXAttestationEnclave-SGXComputation-groupSelect').html(SGXgroups);
    this.settingsPanelContainer.find('#SGXAttestationEnclave-newGroup').html('');
    this.settingsPanelContainer.find('#SGXAttestationEnclave-SGXComputation-newGroup').html('');
    this.settingsPanelContainer.find('#SGXAttestationEnclave-inputObject').html(inputObject);
    this.settingsPanelContainer.find('#SGXAttestationEnclave-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.find('#SGXAttestationEnclave-SGXComputation-otherGroupTasks').html(SGXtaskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButtons();
    this.terminateGroupSelectDropdowns();
    this.removeAllSGXAttestationGroupsAndTheirInputsOutputsHighlights();
    this.removeAllSGXComputationGroupsAndTheirInputsOutputsHighlights();
    this.SGXAttestationEnclaveAndEvaluateGroupsTasks = null;
    this.SGXComputationGroupsTasks = null;
    this.selectedGroup = null;
    this.selectedSGXGroup = null;
  }

  saveStereotypeSettings() {
    let self = this;
    let currentStereotypeSettings = this.getCurrentStereotypeSettings();
    this.settingsPanelContainer.find('.form-group').removeClass('has-error');
    this.settingsPanelContainer.find('.help-block').hide();
    if (this.areInputsAndOutputsNumbersCorrect()) {
      let group = currentStereotypeSettings.groupId;
      let SGXGroup = currentStereotypeSettings.SGXgroupId;
      if (group) {
        let tasks = this.getSGXAttestationGroupTasks(group);
        let taskAlreadyInGroup = tasks.filter((obj) => {
          return obj.id == self.task.id;
        });
        if (tasks.length === 2 && taskAlreadyInGroup.length !== 1) {
          this.settingsPanelContainer.find('#SGXAttestationEnclave-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#SGXAttestationEnclave-groupSelect-help2').show();
          return;
        } else if (tasks.length === 1) {
          for (let task of tasks) {
            if (task.businessObject.SGXAttestationEnclave != null && task.id != this.task.id) {
              this.settingsPanelContainer.find('#SGXAttestationEnclave-groupSelect-form-group').addClass('has-error');
              this.settingsPanelContainer.find('#SGXAttestationEnclave-groupSelect-help2').show();
              return;
            }
          }
        }
        if (this.getSavedStereotypeSettings() == null) {
          this.addStereotypeToElement();
        }
        this.setGroup(group);
        this.setSGXGroup(SGXGroup);
        this.SGXAttestationEnclaveAndEvaluateGroupsTasks = $.grep(this.SGXAttestationEnclaveAndEvaluateGroupsTasks, (el, idx) => { return el.taskId == this.task.id }, true);
        this.SGXAttestationEnclaveAndEvaluateGroupsTasks.push({ groupId: group, taskId: this.task.id });
        if (SGXGroup != "") {
          this.SGXComputationGroupsTasks = $.grep(this.SGXComputationGroupsTasks, (el, idx) => { return el.taskId == this.task.id }, true);
          this.SGXComputationGroupsTasks.push({ groupId: SGXGroup, taskId: this.task.id });
        }
        for (let task of this.getSGXAttestationGroupTasks(group)) {
          if (task.id == this.task.id) {
            task.businessObject.SGXAttestationEnclave = JSON.stringify(currentStereotypeSettings);
          }
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        return true;
      } else {
        this.settingsPanelContainer.find('#SGXAttestationEnclave-groupSelect-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#SGXAttestationEnclave-groupSelect-help').show();
      }
    } else {
      this.settingsPanelContainer.find('#SGXAttestationEnclave-conditions-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXAttestationEnclave-conditions-help').show();
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

  /** SGXAttestationEnclave class specific functions */
  init() {
    if (this.getSavedStereotypeSettings() != null) {
      this.setGroup(this.getSavedStereotypeSettings().groupId);
      this.setSGXGroup(this.getSavedStereotypeSettings().SGXgroupId);
    }
    this.addStereotypeToTheListOfGroupStereotypesOnModel(this.getTitle());
  }

  loadAllSGXAttestationGroupsTasks() {
    this.SGXAttestationEnclaveAndEvaluateGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "SGXAttestationEnclave" && (<SGXAttestationEnclave>stereotype).getGroup() != null) {
          this.SGXAttestationEnclaveAndEvaluateGroupsTasks.push({ groupId: (<SGXAttestationEnclave>stereotype).getGroup(), taskId: stereotype.task.id });
        }
        if (stereotype.getTitle() == "SGXAttestationChallenge" && (<SGXAttestationChallenge>stereotype).getGroup() != null) {
          this.SGXAttestationEnclaveAndEvaluateGroupsTasks.push({ groupId: (<SGXAttestationChallenge>stereotype).getGroup(), taskId: stereotype.task.id });
        }
      }
    }
  }

  loadAllSGXComputationGroupsTasks() {
    this.SGXComputationGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "SGXComputation" && (<SGXComputation>stereotype).getGroup() != null) {
          this.SGXComputationGroupsTasks.push({ groupId: (<SGXComputation>stereotype).getGroup(), taskId: stereotype.task.id });
        }
        if (stereotype.getTitle() == "SGXProtect" && (<SGXProtect>stereotype).getGroup() != null) {
          this.SGXComputationGroupsTasks.push({ groupId: (<SGXProtect>stereotype).getGroup(), taskId: stereotype.task.id });
        }
        if (stereotype.getTitle() == "SGXAttestationEnclave" && (<SGXAttestationEnclave>stereotype).getSGXGroup() != null && (<SGXAttestationEnclave>stereotype).getSGXGroup() != "") {
          this.SGXComputationGroupsTasks.push({ groupId: (<SGXAttestationEnclave>stereotype).getSGXGroup(), taskId: stereotype.task.id });
        }
      }
    }
  }

  initAddGroupButtons() {
    let self = this;
    this.terminateAddGroupButtons();
    this.settingsPanelContainer.one('click', '#SGXAttestationEnclave-add-button', (e) => {
      let group = self.settingsPanelContainer.find('#SGXAttestationEnclave-newGroup').val();
      this.addSGXAttestationEnclaveGroup(group);
    });
    this.settingsPanelContainer.one('click', '#SGXAttestationEnclave-SGXComputation-add-button', (e) => {
      let SGXgroup = self.settingsPanelContainer.find('#SGXAttestationEnclave-SGXComputation-newGroup').val();
      this.addSGXComputationGroup(SGXgroup);
    });
  }

  terminateAddGroupButtons() {
    this.settingsPanelContainer.off('click', '#SGXAttestationEnclave-add-button');
    this.settingsPanelContainer.off('click', '#SGXAttestationEnclave-SGXComputation-add-button');
  }

  initGroupSelectDropdowns() {
    this.settingsPanelContainer.one('change', '#SGXAttestationEnclave-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });
    this.settingsPanelContainer.one('change', '#SGXAttestationEnclave-SGXComputation-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedSGXGroup(e.target.value);
    });
  }

  terminateGroupSelectDropdowns() {
    this.settingsPanelContainer.off('change', '#SGXAttestationEnclave-groupSelect');
    this.settingsPanelContainer.off('change', '#SGXAttestationEnclave-SGXComputation-groupSelect');
  }

  addSGXAttestationEnclaveGroup(group: string) {
    this.settingsPanelContainer.find('.form-group').removeClass('has-error');
    this.settingsPanelContainer.find('.help-block').hide();
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#SGXAttestationEnclave-newGroup').val('');
      this.settingsPanelContainer.find('#SGXAttestationEnclave-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.settingsPanelContainer.find('#SGXAttestationEnclave-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXAttestationEnclave-newGroup-help').show();
      this.initAddGroupButtons();
    }
  }

  addSGXComputationGroup(group: string) {
    this.settingsPanelContainer.find('.form-group').removeClass('has-error');
    this.settingsPanelContainer.find('.help-block').hide();
    if (group) {
      this.reloadStereotypeSettingsWithSelectedSGXGroup(group);
      this.settingsPanelContainer.find('#SGXAttestationEnclave-SGXComputation-newGroup').val('');
      this.settingsPanelContainer.find('#SGXAttestationEnclave-SGXComputation-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.settingsPanelContainer.find('#SGXAttestationEnclave-SGXComputation-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SGXAttestationEnclave-SGXComputation-newGroup-help').show();
      this.initAddGroupButtons();
    }
  }

  reloadStereotypeSettingsWithSelectedGroup(group: string) {
    // Create temporary object to save current stereotype group
    let tmpObj = { groupId: this.getGroup(), SGXGroupId: this.getSGXGroup() };
    let currentGroupObj = $.extend({}, tmpObj);
    if (!this.groupsTempInfo) {
      this.groupsTempInfo = currentGroupObj;
    }

    // Terminate current task stereotype settings
    this.terminateStereotypeSettings();

    // Set selected group temporarily to new selected group to init stereotype settings based on new group
    this.selectedGroup = group;
    this.selectedSGXGroup = currentGroupObj.SGXGroupId;
    this.groupsTempInfo.groupId = group;

    this.reloadtStereotypeSettings();
  }

  reloadStereotypeSettingsWithSelectedSGXGroup(SGXGroup: string) {
    // Create temporary object to save current stereotype group
    let tmpObj = null;
    if (this.groupsTempInfo) {
      tmpObj = { groupId: this.groupsTempInfo.groupId, SGXGroupId: this.groupsTempInfo.SGXGroupId };
    } else {
      tmpObj = { groupId: this.getGroup(), SGXGroupId: this.getSGXGroup() };
    }
    let currentGroupObj = $.extend({}, tmpObj);
    this.groupsTempInfo = currentGroupObj;

    // Terminate current task stereotype settings
    this.terminateStereotypeSettings();

    // Set selected group temporarily to new selected group to init stereotype settings based on new group
    this.selectedGroup = currentGroupObj.groupId;
    this.selectedSGXGroup = SGXGroup;
    this.groupsTempInfo.SGXGroupId = SGXGroup;

    this.reloadtStereotypeSettings();
  }

  reloadtStereotypeSettings() {
    this.initAllElementStereotypesSettings();
    this.initStereotypeSettings();
    // Set selected group back to null (in case new group is not going to be saved)
    this.selectedGroup = null;
    this.selectedSGXGroup = null;
  }

  highlightSGXAttestationGroupMembersAndTheirInputsOutputs(group: string) {
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

  highlightSGXComputationGroupMembersAndTheirInputsOutputs(group: string) {
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

  getSGXComputationGroupInputOutputObjects(group: string) {
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

  getModelSGXAttestationGroups() {
    let difGroups = [];
    for (let i = 0; i < this.SGXAttestationEnclaveAndEvaluateGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getSGXAttestationGroupTasks(group: string) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.SGXAttestationEnclaveAndEvaluateGroupsTasks, function (el, idx) { return el.groupId.trim() == group.trim() }, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
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

  getSGXComputationGroupTasks(group: string) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.SGXComputationGroupsTasks, function (el, idx) { return el.groupId.trim() == group.trim() }, false);
      for (let i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getSGXAttestationGroupInputOutputObjects(group: string) {
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
    // Outputs: exactly 0
    let numberOfOutputs = this.getTaskOutputObjects().length;
    if (numberOfOutputs != 0) {
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
    let savedData = this.getSavedStereotypeSettings();

    if (!this.areInputsAndOutputsNumbersCorrect()) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationEnclave error: no outputs are required", [this.task.id], []);
    }
    if (groupTasks.length < 2) {
      this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationEnclave error: element with SGXAttestationChallenge stereotype is missing from the group", [this.task.id], []);
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
      this.addUniqueErrorToErrorsList(existingErrors, "SGXAttestationEnclave error: groupId is undefined", [this.task.id], []);
    }
  }

}