import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

interface SSComputationGroupTaskObject {
    groupId: String;
    taskId: String;
}

export class SSComputation extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SSComputation", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  SSComputationGroupsTasks: SSComputationGroupTaskObject[] = [];

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

    this.loadAllSSComputationGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelSSComputationGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its inputs and outputs would be highlighted
        this.SSComputationGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.task.SSComputation != null) {
      selectedGroupId = this.getGroup();
    } else {
      if (this.SSComputationGroupsTasks.length > 0) {
        selectedGroupId = this.SSComputationGroupsTasks[0].groupId;
      }
    }

    inputScript = this.getSSComputationGroupInputScript(selectedGroupId);
    this.highlightSSComputationGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelSSComputationGroups()) {
      var sel = "";
      if (selectedGroupId !== null) {
        if (group == selectedGroupId) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelSSComputationGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
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
      for (let groupTask of this.getSSComputationGroupTasks(selectedGroupId)) {
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
  
    this.settingsPanelContainer.find('#SSComputation-taskName').html(this.task.name);
    this.settingsPanelContainer.find('#SSComputation-groupSelect').html(groups);
    this.settingsPanelContainer.find('#SSComputation-inputScript').val(inputScript);
    this.settingsPanelContainer.find('#SSComputation-inputObjects').html(inputObjects);
    this.settingsPanelContainer.find('#SSComputation-outputObjects').html(outputObjects);
    this.settingsPanelContainer.find('#SSComputation-newGroup').html('');
    this.settingsPanelContainer.find('#SSComputation-otherGroupTasks').html(taskObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllSSComputationGroupsAndTheirInputsOutputsHighlights();
    this.SSComputationGroupsTasks = null;
    this.selectedGroup = null;
  }

  saveStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#SSComputation-groupSelect').val();
    let inputScript = this.settingsPanelContainer.find('#SSComputation-inputScript').val();
    if (group) {
      if (this.task.SSComputation == null) {
        this.addStereotypeToElement();
      }
      this.setGroup(group);
      this.SSComputationGroupsTasks = $.grep(this.SSComputationGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
      this.SSComputationGroupsTasks.push({groupId: group, taskId: this.task.id});
      for (let task of this.getSSComputationGroupTasks(group)) {
        task.businessObject.SSComputation = JSON.stringify({groupId: group, inputScript: inputScript});
      }
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#SSComputation-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SSComputation-groupSelect-help').show();
    }
  }

  removeStereotype() {
    super.removeStereotype();
  }

  /** SSComputation class specific functions */
  init() {
    if (this.task.SSComputation != null) {
      this.setGroup(JSON.parse(this.task.SSComputation).groupId);
    }
  }

  loadAllSSComputationGroupsTasks() {
    this.SSComputationGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "SSComputation" && (<SSComputation>stereotype).getGroup() != null) {
          this.SSComputationGroupsTasks.push({groupId: (<SSComputation>stereotype).getGroup(), taskId: stereotype.task.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#SSComputation-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#SSComputation-newGroup').val();
      this.addSSComputationGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#SSComputation-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#SSComputation-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#SSComputation-groupSelect');
  }

  addSSComputationGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#SSComputation-newGroup').val('');
      this.settingsPanelContainer.find('#SSComputation-inputScript').val('');
      this.settingsPanelContainer.find('#SSComputation-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#SSComputation-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#SSComputation-newGroup-help').show();
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

  highlightSSComputationGroupMembersAndTheirInputsOutputs(group: String) {

    for (var i = 0; i < this.SSComputationGroupsTasks.length; i++) {
      var groupId = this.SSComputationGroupsTasks[i].groupId;
      var taskId = this.SSComputationGroupsTasks[i].taskId;

      if (groupId == group) {
        this.canvas.addMarker(taskId, 'highlight-group');

        let groupInputsOutputs = this.getSSComputationGroupInputOutputObjects(groupId);

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

  removeAllSSComputationGroupsAndTheirInputsOutputsHighlights() {
    if (this.SSComputationGroupsTasks) {
      for (var i = 0; i < this.SSComputationGroupsTasks.length; i++) {
        var taskId = this.SSComputationGroupsTasks[i].taskId;
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
          for (let inputOutputObj of this.getSSComputationGroupInputOutputObjects(this.SSComputationGroupsTasks[i].groupId)) {
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
            this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output');
          }
        }
      }
    }
  }

  getModelSSComputationGroups() {
    var difGroups = [];
    for (var i = 0; i < this.SSComputationGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.SSComputationGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.SSComputationGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getSSComputationGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.SSComputationGroupsTasks, function(el, idx) {return el.groupId == group}, false);
      for (var i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getSSComputationGroupInputOutputObjects(group: String) {
    let objects = [];
    if (this.SSComputationGroupsTasks && group != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let task of this.getSSComputationGroupTasks(group)) {
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

  getSSComputationGroupInputScript(group: String) {
    let script = "";
    if (group != null) {
      let groupTasks = this.getSSComputationGroupTasks(group);
      if (groupTasks.length == 1) {
        if (groupTasks[0].businessObject.SSComputation) {
          script = JSON.parse(groupTasks[0].businessObject.SSComputation).inputScript;
        }
        } else {
        for (let groupTask of groupTasks) {
          if (groupTask.id != this.task.id) {
            script = JSON.parse(groupTask.businessObject.SSComputation).inputScript;
            break;
          }
        }
      }
    }
    return script;
  }

}