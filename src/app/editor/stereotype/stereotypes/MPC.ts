import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

interface MPCGroupTaskObject {
    groupId: String;
    taskId: String;
}

export class MPC extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("MPC", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  MPCGroupsTasks: MPCGroupTaskObject[] = [];

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

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    var selectedGroupId = null;
    var groups;
    var inputObjects = "";
    var outputObjects = "";
    let inputScript;

    this.loadAllMPCGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelMPCGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its inputs and outputs would be highlighted
        this.MPCGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.task.MPC != null) {
      selectedGroupId = this.getGroup();
    } else {
      if (this.MPCGroupsTasks.length > 0) {
        selectedGroupId = this.MPCGroupsTasks[0].groupId;
      }
    }

    inputScript = this.getMPCGroupInputScript(selectedGroupId);
    this.highlightMPCGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelMPCGroups()) {
      var sel = "";
      if (selectedGroupId !== null) {
        if (group == selectedGroupId) {
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
          taskObjs += '<label class="text-16">' + groupTask.businessObject.name + '</label>'
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
  
    this.settingsPanelContainer.find('#MPC-taskName').html(this.task.name);
    this.settingsPanelContainer.find('#MPC-groupSelect').html(groups);
    this.settingsPanelContainer.find('#MPC-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#MPC-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#MPC-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#MPC-newGroup').html('');
    this.settingsPanelContainer.find('#MPC-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllMPCGroupsAndTheirInputsOutputsHighlights();
    this.MPCGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#MPC-groupSelect').val();
    let inputScript = this.settingsPanelContainer.find('#MPC-inputScript').val();
    if (group) {
      if (this.task.MPC == null) {
        this.addStereotypeToElement();
      }
      this.setGroup(group);
      this.MPCGroupsTasks = $.grep(this.MPCGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
      this.MPCGroupsTasks.push({groupId: group, taskId: this.task.id});
      for (let task of this.getMPCGroupTasks(group)) {
        task.businessObject.MPC = JSON.stringify({groupId: group, inputScript: inputScript});
      }
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#MPC-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#MPC-groupSelect-help').show();
    }
  }

  removeStereotype() {
    super.removeStereotype();
  }

  /** MPC class specific functions */
  init() {
    if (this.task.MPC != null) {
      this.setGroup(JSON.parse(this.task.MPC).groupId);
    }
  }

  loadAllMPCGroupsTasks() {
    this.MPCGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "MPC" && (<MPC>stereotype).getGroup() != null) {
          this.MPCGroupsTasks.push({groupId: (<MPC>stereotype).getGroup(), taskId: stereotype.task.id});
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

  addMPCGroup(group: String) {
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

  highlightMPCGroupMembersAndTheirInputsOutputs(group: String) {

    for (var i = 0; i < this.MPCGroupsTasks.length; i++) {
      var groupId = this.MPCGroupsTasks[i].groupId;
      var taskId = this.MPCGroupsTasks[i].taskId;

      if (groupId == group) {
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
      for (var i = 0; i < this.MPCGroupsTasks.length; i++) {
        var taskId = this.MPCGroupsTasks[i].taskId;
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
    var difGroups = [];
    for (var i = 0; i < this.MPCGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.MPCGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.MPCGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getMPCGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.MPCGroupsTasks, function(el, idx) {return el.groupId == group}, false);
      for (var i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getMPCGroupInputOutputObjects(group: String) {
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

  getMPCGroupInputScript(group: String) {
    let script = "";
    if (group != null) {
      let groupTasks = this.getMPCGroupTasks(group);
      if (groupTasks.length == 1) {
        if (groupTasks[0].businessObject.MPC) {
          script = JSON.parse(groupTasks[0].businessObject.MPC).inputScript;
        }
        } else {
        for (let groupTask of groupTasks) {
          if (groupTask.id != this.task.id) {
            script = JSON.parse(groupTask.businessObject.MPC).inputScript;
            break;
          }
        }
      }
    }
    return script;
  }

}