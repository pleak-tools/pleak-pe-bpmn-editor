import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";
import { SGXAttestationEnclave } from "./SGXAttestationEnclave";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

interface SGXAttestationChallengeGroupTaskObject {
    groupId: String;
    taskId: String;
}

export class SGXAttestationChallenge extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("SGXAttestationChallenge", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  SGXAttestationEnclaveAndEvaluateGroupsTasks: SGXAttestationChallengeGroupTaskObject[] = [];

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
    var inputObject = "";
    var outputObject = "";
    var selected = null;

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
      var sel = "";
      if (selectedGroupId !== null) {
        if (group == selectedGroupId) {
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
          taskObjs += '<label class="text-16">' + groupTask.businessObject.name + '</label>'
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
  
    this.settingsPanelContainer.find('#SGXAttestationChallenge-taskName').html(this.task.name);
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
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (group) {
      if (numberOfOutputs == 1) {
        let tasks = this.getSGXAttestationGroupTasks(group);
        let taskAlreadyInGroup = tasks.filter(( obj ) => {
          return obj.id == self.task.id;
        });
        if (tasks.length == 2 && taskAlreadyInGroup.length !== 1) {
          this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#SGXAttestationChallenge-groupSelect-help2').show();
          return;
        } else if (tasks.length == 1) {
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
          } else {
            task.businessObject.SGXAttestationEnclave = JSON.stringify({groupId: group});
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
    super.removeStereotype();
  }

  /** SGXAttestationChallenge class specific functions */
  init() {
    if (this.task.SGXAttestationChallenge != null) {
      this.setGroup(JSON.parse(this.task.SGXAttestationChallenge).groupId);
    }
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

    for (var i = 0; i < this.SGXAttestationEnclaveAndEvaluateGroupsTasks.length; i++) {
      var groupId = this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].groupId;
      var taskId = this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].taskId;

      if (groupId == group) {
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
      for (var i = 0; i < this.SGXAttestationEnclaveAndEvaluateGroupsTasks.length; i++) {
        var taskId = this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].taskId;
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
    var difGroups = [];
    for (var i = 0; i < this.SGXAttestationEnclaveAndEvaluateGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.SGXAttestationEnclaveAndEvaluateGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getSGXAttestationGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.SGXAttestationEnclaveAndEvaluateGroupsTasks, function(el, idx) {return el.groupId == group}, false);
      for (var i = 0; i < groups.length; i++) {
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

}