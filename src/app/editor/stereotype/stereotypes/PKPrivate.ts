import { ValidationErrorObject } from "../../handler/validation-handler";
import { DataObjectStereotype } from "../data-object-stereotype";
import { DataObjectHandler } from "../../handler/data-object-handler";
import { PKPublic } from "./PKPublic";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

interface PKPrivateGroupDataObject {
    groupId: String;
    dataObjectId: String;
}

export class PKPrivate extends DataObjectStereotype {

  constructor(dataObjectHandler: DataObjectHandler) {
    super("PKPrivate", dataObjectHandler);
    this.init();
  }

  group: String = null;
  selectedGroup: String = null;
  PKPublicAndPrivateGroupsDataObjects: PKPrivateGroupDataObject[] = [];

  /** Functions inherited from DataObjectStereotype and Stereotype classes */
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
    this.loadAllPKPublicAndPKPrivateGroupsDataObjects();
    super.initStereotypePublicView();
    this.highlightPKPublicAndPKPrivateGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    let selectedGroupId = null;
    let groups;
    let selected = null;

    this.loadAllPKPublicAndPKPrivateGroupsDataObjects();

    if (this.selectedGroup != null) {
      if (this.getModelPKPublicAndPKPrivateGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no dataObjects in it yet, add current dataObject into it so its outputs would be highlighted
        this.PKPublicAndPrivateGroupsDataObjects.push({groupId: this.selectedGroup, dataObjectId: this.dataObject.id});
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.dataObject.PKPrivate != null) {
      selectedGroupId = this.getGroup();
      selected = JSON.parse(this.dataObject.PKPrivate);
    } else {
      if (this.PKPublicAndPrivateGroupsDataObjects.length > 0) {
        selectedGroupId = this.PKPublicAndPrivateGroupsDataObjects[0].groupId;
      }
    }

    this.highlightPKPublicAndPKPrivateGroupMembersAndTheirInputsOutputs(selectedGroupId);

    for (let group of this.getModelPKPublicAndPKPrivateGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelPKPublicAndPKPrivateGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no dataObjects in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    let dataObjs = "";
    if (selectedGroupId !== null) {
      for (let groupObject of this.getPKPublicAndPKPrivateGroupObjects(selectedGroupId)) {
        if (groupObject.id != this.dataObject.id && groupObject.businessObject.PKPublic != null) {
          let dataObjectName = undefined;
          if (groupObject.businessObject.name) {
            dataObjectName = groupObject.businessObject.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
          dataObjs += '<label class="text-16">' + dataObjectName + '</label>'
          dataObjs += '<ul class="stereotype-option">';
          dataObjs += '</ul>';
        }
      }
    }
  
    this.settingsPanelContainer.find('#PKPrivate-dataObjectName').text(this.dataObject.name);
    this.settingsPanelContainer.find('#PKPrivate-groupSelect').html(groups);
    this.settingsPanelContainer.find('#PKPrivate-newGroup').html('');
    this.settingsPanelContainer.find('#PKPrivate-otherGroupObjects').html(dataObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllPKPublicAndPKPrivateGroupsHighlights();
    this.PKPublicAndPrivateGroupsDataObjects = null;
    this.selectedGroup = null;
  }

  getGroupPKPrivateElementName(group: String) {
    let dataObjects = this.getPKPublicAndPKPrivateGroupObjects(group);
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.PKPrivate) {
          return dataObject.businessObject.name;
        }
      }
    }
    return null;
  }

  saveStereotypeSettings() {
    let self = this;
    let group = this.settingsPanelContainer.find('#PKPrivate-groupSelect').val();
    if (group) {
      let dataObjects = this.getPKPublicAndPKPrivateGroupObjects(group);
      let dataObjectAlreadyInGroup = dataObjects.filter(( obj ) => {
        return obj.id == self.dataObject.id;
      });
      if (dataObjects.length === 2 && dataObjectAlreadyInGroup.length !== 1) {
        if (this.getGroupPKPrivateElementName(group).trim() != this.dataObject.name.trim()) {
          this.settingsPanelContainer.find('#PKPrivate-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#PKPrivate-groupSelect-help2').show();
          return;
        }
      } else if (dataObjects.length === 1) {
        for (let dataObject of dataObjects) {
          if (dataObject.businessObject.PKPrivate != null && dataObject.id != this.dataObject.id) {
            this.settingsPanelContainer.find('#PKPrivate-groupSelect-form-group').addClass('has-error');
            this.settingsPanelContainer.find('#PKPrivate-groupSelect-help2').show();
            return;
          }
        }
      }
      if (this.dataObject.PKPrivate == null) {
        this.addStereotypeToElement();
      }
      this.setGroup(group);
      this.PKPublicAndPrivateGroupsDataObjects = $.grep(this.PKPublicAndPrivateGroupsDataObjects, (el, idx) => {return el.dataObjectId == this.dataObject.id}, true);
      this.PKPublicAndPrivateGroupsDataObjects.push({groupId: group, dataObjectId: this.dataObject.id});
      for (let dataObject of this.getPKPublicAndPKPrivateGroupObjects(group)) {
        if (dataObject.id == this.dataObject.id) {
            dataObject.businessObject.PKPrivate = JSON.stringify({groupId: group});
          }
      }
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      super.saveStereotypeSettings();
    } else {
      this.settingsPanelContainer.find('#PKPrivate-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#PKPrivate-groupSelect-help').show();
    }
  }

  removeStereotype() {
    super.removeStereotype();
  }

  /** PKPrivate class specific functions */
  init() {
    if (this.dataObject.PKPrivate != null) {
      this.setGroup(JSON.parse(this.dataObject.PKPrivate).groupId);
    }
  }

  loadAllPKPublicAndPKPrivateGroupsDataObjects() {
    this.PKPublicAndPrivateGroupsDataObjects = [];
    for (let dataObjectHandler of this.dataObjectHandler.getAllModelDataObjectHandlers()) {
      for (let stereotype of dataObjectHandler.stereotypes) {
        if (stereotype.getTitle() == "PKPrivate" && (<PKPrivate>stereotype).getGroup() != null) {
          this.PKPublicAndPrivateGroupsDataObjects.push({groupId: (<PKPrivate>stereotype).getGroup(), dataObjectId: stereotype.dataObject.id});
        }
        if (stereotype.getTitle() == "PKPublic" && (<PKPublic>stereotype).getGroup() != null) {
          this.PKPublicAndPrivateGroupsDataObjects.push({groupId: (<PKPublic>stereotype).getGroup(), dataObjectId: stereotype.dataObject.id});
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#PKPrivate-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#PKPrivate-newGroup').val();
      this.addPKPrivateGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#PKPrivate-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#PKPrivate-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#PKPrivate-groupSelect');
  }

  addPKPrivateGroup(group: String) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#PKPrivate-newGroup').val('');
      this.settingsPanelContainer.find('#PKPrivate-otherGroupObjects').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#PKPrivate-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#PKPrivate-newGroup-help').show();
    }
  }

  reloadStereotypeSettingsWithSelectedGroup(group: String) {
    // Create temporary object to save current stereotype group
    let tmpObj = {groupId: this.getGroup()};
    let currentGroupObj = $.extend({}, tmpObj);

    // Terminate current dataObject stereotype settings
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

  highlightPKPublicAndPKPrivateGroupMembersAndTheirInputsOutputs(group: String) {
    for (let i = 0; i < this.PKPublicAndPrivateGroupsDataObjects.length; i++) {
      let groupId = this.PKPublicAndPrivateGroupsDataObjects[i].groupId;
      let dataObjectId = this.PKPublicAndPrivateGroupsDataObjects[i].dataObjectId;
      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(dataObjectId, 'highlight-group');
      }
    }
  }

  removeAllPKPublicAndPKPrivateGroupsHighlights() {
    if (this.PKPublicAndPrivateGroupsDataObjects) {
      for (let i = 0; i < this.PKPublicAndPrivateGroupsDataObjects.length; i++) {
        let dataObjectId = this.PKPublicAndPrivateGroupsDataObjects[i].dataObjectId;
        this.canvas.removeMarker(dataObjectId, 'highlight-group');
      }
    }
  }

  getModelPKPublicAndPKPrivateGroups() {
    let difGroups = [];
    for (let i = 0; i < this.PKPublicAndPrivateGroupsDataObjects.length; i++) {
      if (difGroups.indexOf(this.PKPublicAndPrivateGroupsDataObjects[i].groupId) === -1) {
        difGroups.push(this.PKPublicAndPrivateGroupsDataObjects[i].groupId);
      }
    }
    return difGroups;
  }

  getPKPublicAndPKPrivateGroupObjects(group: String) {
    let groupDataObjects = [];
    if (group) {
      let groups = $.grep(this.PKPublicAndPrivateGroupsDataObjects, function(el, idx) {return el.groupId.trim() == group.trim()}, false);
      for (let i = 0; i < groups.length; i++) {
        groupDataObjects.push(this.registry.get(groups[i].dataObjectId));
      }
    }
    return groupDataObjects;
  }

  getGroupSecondElementId() {
    let groupDataObjects = this.getPKPublicAndPKPrivateGroupObjects(this.getGroup());
    let groupDataObjectsIds = groupDataObjects.map(a => a.id);
    if (groupDataObjectsIds.length === 2) {
      groupDataObjectsIds.splice(groupDataObjectsIds.indexOf(this.dataObject.id),1);
      return groupDataObjectsIds[0];
    }
    return null;
  }

  /** Validation functions */
  doesPairHaveKeysOfBothTypes() {
    let dataObjects = this.getPKPublicAndPKPrivateGroupObjects(this.getGroup());
    let PKPublicKey = null;
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.PKPublic) {
          PKPublicKey = dataObject;
          break;
        }
      }
    }
    if (!PKPublicKey) {
      return false;
    }
    return true;
  }

  getGroupPKPrivateDataObjectsIds() {
    let PKPrivateDataObjects = [];
    let dataObjects = this.getPKPublicAndPKPrivateGroupObjects(this.getGroup());
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.PKPrivate) {
          PKPrivateDataObjects.push(dataObject);
        }
      }
    }
    return PKPrivateDataObjects;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllPKPublicAndPKPrivateGroupsDataObjects();

    let savedData = JSON.parse(this.dataObject.PKPrivate);

    if (!this.doesPairHaveKeysOfBothTypes()) {
      this.addUniqueErrorToErrorsList(existingErrors, "PKPrivate error: PKPublic key is missing from the pair", this.getGroupPKPrivateDataObjectsIds(), []);
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "PKPrivate error: groupId is undefined", [this.dataObject.id], []);
    }
  }

}