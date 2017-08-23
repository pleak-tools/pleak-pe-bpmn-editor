import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";
import { OTSend } from "./OTSend";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

interface OTReceiveGroupTaskObject {
    groupId: String;
    taskId: String;
}

export class OTReceive extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("OTReceive", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  OTSendAndEvaluateGroupsTasks: OTReceiveGroupTaskObject[] = [];

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
    this.loadAllOTSendAndOTReceiveGroupsTasks();
    super.initStereotypePublicView();
    this.highlightOTSendAndOTReceiveGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    var selectedGroupId = null;
    var groups;
    var inputObject = "";
    var outputObject = "";
    var selected = null;

    this.loadAllOTSendAndOTReceiveGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelOTSendAndOTReceiveGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its outputs would be highlighted
        this.OTSendAndEvaluateGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.task.OTReceive != null) {
      selectedGroupId = this.getGroup();
      selected = JSON.parse(this.task.OTReceive);
    } else {
      if (this.OTSendAndEvaluateGroupsTasks.length > 0) {
        selectedGroupId = this.OTSendAndEvaluateGroupsTasks[0].groupId;
      }
    }

    this.highlightOTSendAndOTReceiveGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelOTSendAndOTReceiveGroups()) {
      var sel = "";
      if (selectedGroupId !== null) {
        if (group == selectedGroupId) {
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
          let taskName = groupTask.businessObject.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  
    this.settingsPanelContainer.find('#OTReceive-taskName').text(this.task.name);
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
    let group = this.settingsPanelContainer.find('#OTReceive-groupSelect').val();
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (group) {
      if (numberOfOutputs == 1 && numberOfInputs == 1) {
        let tasks = this.getOTSendAndOTReceiveGroupTasks(group);
        let taskAlreadyInGroup = tasks.filter(( obj ) => {
          return obj.id == self.task.id;
        });
        if (tasks.length == 2 && taskAlreadyInGroup.length !== 1) {
          this.settingsPanelContainer.find('#OTReceive-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#OTReceive-groupSelect-help2').show();
          return;
        } else if (tasks.length == 1) {
          for (let task of tasks) {
            if (task.businessObject.OTReceive != null && task.id != this.task.id) {
              this.settingsPanelContainer.find('#OTReceive-groupSelect-form-group').addClass('has-error');
              this.settingsPanelContainer.find('#OTReceive-groupSelect-help2').show();
              return;
            }
          }
        }
        if (this.task.OTReceive == null) {
          this.addStereotypeToElement();
        }
        this.setGroup(group);
        this.OTSendAndEvaluateGroupsTasks = $.grep(this.OTSendAndEvaluateGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
        this.OTSendAndEvaluateGroupsTasks.push({groupId: group, taskId: this.task.id});
        for (let task of this.getOTSendAndOTReceiveGroupTasks(group)) {
          if (task.id == this.task.id) {
            task.businessObject.OTReceive = JSON.stringify({groupId: group});
          } else {
            task.businessObject.OTSend = JSON.stringify({groupId: group});
          }
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        super.saveStereotypeSettings();
      } else {
        this.settingsPanelContainer.find('#OTReceive-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#OTReceive-conditions-help').show();
        this.initSaveAndRemoveButtons();
      }
    } else {
      this.settingsPanelContainer.find('#OTReceive-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#OTReceive-groupSelect-help').show();
    }
  }

  removeStereotype() {
    super.removeStereotype();
  }

  /** OTReceive class specific functions */
  init() {
    if (this.task.OTReceive != null) {
      this.setGroup(JSON.parse(this.task.OTReceive).groupId);
    }
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

    for (var i = 0; i < this.OTSendAndEvaluateGroupsTasks.length; i++) {
      var groupId = this.OTSendAndEvaluateGroupsTasks[i].groupId;
      var taskId = this.OTSendAndEvaluateGroupsTasks[i].taskId;

      if (groupId == group) {
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
      for (var i = 0; i < this.OTSendAndEvaluateGroupsTasks.length; i++) {
        var taskId = this.OTSendAndEvaluateGroupsTasks[i].taskId;
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
    var difGroups = [];
    for (var i = 0; i < this.OTSendAndEvaluateGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.OTSendAndEvaluateGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.OTSendAndEvaluateGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getOTSendAndOTReceiveGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.OTSendAndEvaluateGroupsTasks, function(el, idx) {return el.groupId == group}, false);
      for (var i = 0; i < groups.length; i++) {
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

}