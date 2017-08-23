import { TaskStereotype } from "../task-stereotype";
import { TaskHandler } from "../../handler/task-handler";
import { GCGarble } from "./GCGarble";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

interface GCEvaluateGroupTaskObject {
    groupId: String;
    taskId: String;
}

export class GCEvaluate extends TaskStereotype {

  constructor(taskHandler: TaskHandler) {
    super("GCEvaluate", taskHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  GCGarbleAndEvaluateGroupsTasks: GCEvaluateGroupTaskObject[] = [];

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
    this.loadAllGCGarbleAndGCEvaluateGroupsTasks();
    super.initStereotypePublicView();
    this.highlightGCGarbleAndGCEvaluateGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    var selectedGroupId = null;
    var groups;
    var garbledCircuit;
    var inputEncoding;
    var outputObject = "";
    var selected = null;

    this.loadAllGCGarbleAndGCEvaluateGroupsTasks();

    if (this.selectedGroup != null) {
      if (this.getModelGCGarbleAndGCEvaluateGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no tasks in it yet, add current task into it so its outputs would be highlighted
        this.GCGarbleAndEvaluateGroupsTasks.push({groupId: this.selectedGroup, taskId: this.task.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.task.GCEvaluate != null) {
      selectedGroupId = this.getGroup();
      selected = JSON.parse(this.task.GCEvaluate);
    } else {
      if (this.GCGarbleAndEvaluateGroupsTasks.length > 0) {
        selectedGroupId = this.GCGarbleAndEvaluateGroupsTasks[0].groupId;
      }
    }

    this.highlightGCGarbleAndGCEvaluateGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelGCGarbleAndGCEvaluateGroups()) {
      var sel = "";
      if (selectedGroupId !== null) {
        if (group == selectedGroupId) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelGCGarbleAndGCEvaluateGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no tasks in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    for (let inputObject of this.getTaskInputObjects()) {
      var selectedGarbledCircuit = "";
      var selectedInputEncoding = "";
      if (selected !== null) {
        if (inputObject.id == selected.garbledCircuit) {
          selectedGarbledCircuit = "selected";
        }
        if (inputObject.id == selected.inputEncoding) {
          selectedInputEncoding = "selected";
        }
      }
      garbledCircuit += '<option ' + selectedGarbledCircuit + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
      inputEncoding += '<option ' + selectedInputEncoding + ' value="' + inputObject.id + '">' + inputObject.businessObject.name + '</option>';
    }

    for (let outputObj of this.getTaskOutputObjects()) {
      outputObject += '<li>' + outputObj.businessObject.name + '</li>';
    }

    let taskObjs = "";
    if (selectedGroupId !== null) {
      for (let groupTask of this.getGCGarbleAndGCEvaluateGroupTasks(selectedGroupId)) {
        if (groupTask.id != this.task.id && groupTask.businessObject.GCGarble != null) {
          taskObjs += '<label class="text-16">' + groupTask.businessObject.name + '</label>'
          taskObjs += '<ul class="stereotype-option">';

          let inputScript = '<label class="text-16">Input script</label>';
          inputScript += '<li>' + JSON.parse(groupTask.businessObject.GCGarble).inputScript + '</li>';

          let taskOutputs = '<label class="text-16">Garbled circuit</label>';
          taskOutputs += '<li>' + this.registry.get(JSON.parse(groupTask.businessObject.GCGarble).garbledCircuit).businessObject.name + '</li>';
          taskOutputs += '<label class="text-16">Input encoding</label>';
          taskOutputs += '<li>' + this.registry.get(JSON.parse(groupTask.businessObject.GCGarble).inputEncoding).businessObject.name + '</li>';

          taskObjs += inputScript;
          taskObjs += taskOutputs;
          taskObjs += '</ul>';
        }
      }
    }
  
    this.settingsPanelContainer.find('#GCEvaluate-taskName').text(this.task.name);
    this.settingsPanelContainer.find('#GCEvaluate-groupSelect').html(groups);
    this.settingsPanelContainer.find('#GCEvaluate-garbledCircuitSelect').html(garbledCircuit);
    this.settingsPanelContainer.find('#GCEvaluate-inputEncodingSelect').html(inputEncoding);
    this.settingsPanelContainer.find('#GCEvaluate-newGroup').html('');
    this.settingsPanelContainer.find('#PKEncrypt-outputObject').html(outputObject);
    this.settingsPanelContainer.find('#GCEvaluate-otherGroupTasks').html(taskObjs);
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
    let group = this.settingsPanelContainer.find('#GCEvaluate-groupSelect').val();
    let garbledCircuit = this.settingsPanelContainer.find('#GCEvaluate-garbledCircuitSelect').val();
    let inputEncoding = this.settingsPanelContainer.find('#GCEvaluate-inputEncodingSelect').val();
    let numberOfOutputs = this.getTaskOutputObjects().length;
    let numberOfInputs = this.getTaskInputObjects().length;
    if (group) {
      if (numberOfOutputs == 1 && numberOfInputs == 2) {
        let tasks = this.getGCGarbleAndGCEvaluateGroupTasks(group);
        let taskAlreadyInGroup = tasks.filter(( obj ) => {
          return obj.id == self.task.id;
        });
        if (tasks.length == 2 && taskAlreadyInGroup.length !== 1) {
          this.settingsPanelContainer.find('#GCEvaluate-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#GCEvaluate-groupSelect-help2').show();
          return;
        } else if (tasks.length == 1) {
          for (let task of tasks) {
            if (task.businessObject.GCEvaluate != null && task.id != this.task.id) {
              this.settingsPanelContainer.find('#GCEvaluate-groupSelect-form-group').addClass('has-error');
              this.settingsPanelContainer.find('#GCEvaluate-groupSelect-help2').show();
              return;
            }
          }
        }
        if (garbledCircuit == inputEncoding) {
          this.settingsPanelContainer.find('#GCEvaluate-conditions-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#GCEvaluate-garbledCircuit-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#GCEvaluate-inputEncoding-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#GCEvaluate-conditions-help2').show();
          this.initSaveAndRemoveButtons();
          return;
        }
        if (this.task.GCEvaluate == null) {
          this.addStereotypeToElement();
        }
        this.setGroup(group);
        this.GCGarbleAndEvaluateGroupsTasks = $.grep(this.GCGarbleAndEvaluateGroupsTasks, (el, idx) => {return el.taskId == this.task.id}, true);
        this.GCGarbleAndEvaluateGroupsTasks.push({groupId: group, taskId: this.task.id});
        for (let task of this.getGCGarbleAndGCEvaluateGroupTasks(group)) {
          if (task.id == this.task.id) {
            task.businessObject.GCEvaluate = JSON.stringify({groupId: group, inputScript: this.getGCGarbleAndGCEvaluateGroupInputScript(group), garbledCircuit: garbledCircuit, inputEncoding: inputEncoding});
          } else {
            task.businessObject.GCGarble = JSON.stringify({groupId: group, inputScript: this.getGCGarbleAndGCEvaluateGroupInputScript(group), garbledCircuit: JSON.parse(task.businessObject.GCGarble).garbledCircuit, inputEncoding: JSON.parse(task.businessObject.GCGarble).inputEncoding});
          }
        }
        this.settingsPanelContainer.find('.form-group').removeClass('has-error');
        this.settingsPanelContainer.find('.help-block').hide();
        super.saveStereotypeSettings();
      } else {
        this.settingsPanelContainer.find('#GCEvaluate-conditions-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#GCEvaluate-conditions-help').show();
        this.initSaveAndRemoveButtons();
      }
    } else {
      this.settingsPanelContainer.find('#GCEvaluate-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#GCEvaluate-groupSelect-help').show();
    }
  }

  removeStereotype() {
    super.removeStereotype();
  }

  /** GCEvaluate class specific functions */
  init() {
    if (this.task.GCEvaluate != null) {
      this.setGroup(JSON.parse(this.task.GCEvaluate).groupId);
    }
  }

  loadAllGCGarbleAndGCEvaluateGroupsTasks() {
    this.GCGarbleAndEvaluateGroupsTasks = [];
    for (let taskHandler of this.taskHandler.getAllModelTaskHandlers()) {
      for (let stereotype of taskHandler.stereotypes) {
        if (stereotype.getTitle() == "GCEvaluate" && (<GCEvaluate>stereotype).getGroup() != null) {
          this.GCGarbleAndEvaluateGroupsTasks.push({groupId: (<GCEvaluate>stereotype).getGroup(), taskId: stereotype.task.id});
        }
        if (stereotype.getTitle() == "GCGarble" && (<GCGarble>stereotype).getGroup() != null) {
          this.GCGarbleAndEvaluateGroupsTasks.push({groupId: (<GCGarble>stereotype).getGroup(), taskId: stereotype.task.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#GCEvaluate-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#GCEvaluate-newGroup').val();
      this.addGCEvaluateGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#GCEvaluate-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#GCEvaluate-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#GCEvaluate-groupSelect');
  }

  addGCEvaluateGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#GCEvaluate-newGroup').val('');
      this.settingsPanelContainer.find('#GCEvaluate-garbledCircuitSelect').val('');
      this.settingsPanelContainer.find('#GCEvaluate-inputEncodingSelect').val('');
      this.settingsPanelContainer.find('#GCEvaluate-otherGroupTasks').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#GCEvaluate-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#GCEvaluate-newGroup-help').show();
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

  highlightGCGarbleAndGCEvaluateGroupMembersAndTheirInputsOutputs(group: String) {

    for (var i = 0; i < this.GCGarbleAndEvaluateGroupsTasks.length; i++) {
      var groupId = this.GCGarbleAndEvaluateGroupsTasks[i].groupId;
      var taskId = this.GCGarbleAndEvaluateGroupsTasks[i].taskId;

      if (groupId == group) {
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
      for (var i = 0; i < this.GCGarbleAndEvaluateGroupsTasks.length; i++) {
        var taskId = this.GCGarbleAndEvaluateGroupsTasks[i].taskId;
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
    var difGroups = [];
    for (var i = 0; i < this.GCGarbleAndEvaluateGroupsTasks.length; i++) {
      if (difGroups.indexOf(this.GCGarbleAndEvaluateGroupsTasks[i].groupId) === -1) {
        difGroups.push(this.GCGarbleAndEvaluateGroupsTasks[i].groupId);
      }
    }
    return difGroups;
  }

  getGCGarbleAndGCEvaluateGroupTasks(group: String) {
    let groupTasks = [];
    if (group) {
      let groups = $.grep(this.GCGarbleAndEvaluateGroupsTasks, function(el, idx) {return el.groupId == group}, false);
      for (var i = 0; i < groups.length; i++) {
        groupTasks.push(this.registry.get(groups[i].taskId));
      }
    }
    return groupTasks;
  }

  getGCGarbleAndGCEvaluateGroupInputOutputObjects(group: String) {
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

  getGCGarbleAndGCEvaluateGroupInputScript(group: String) {
    let script = "";
    if (group != null) {
      let groupTasks = this.getGCGarbleAndGCEvaluateGroupTasks(group);
      if (groupTasks.length == 1) {
        if (groupTasks[0].businessObject.GCEvaluate) {
          script = JSON.parse(groupTasks[0].businessObject.GCEvaluate).inputScript;
        }
      } else {
        for (let groupTask of groupTasks) {
          if (groupTask.id != this.task.id && groupTask.businessObject.GCGarble != null) {
            script = JSON.parse(groupTask.businessObject.GCGarble).inputScript;
            break;
          }
          if (groupTask.id != this.task.id && groupTask.businessObject.GCEvaluate != null) {
            script = JSON.parse(groupTask.businessObject.GCEvaluate).inputScript;
            break;
          }
        }
      }
    }
    return script;
  }

}