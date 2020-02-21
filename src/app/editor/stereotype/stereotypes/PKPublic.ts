import { ValidationErrorObject } from "../../handler/validation-handler";
import { DataObjectStereotype } from "../data-object-stereotype";
import { DataObjectHandler } from "../../handler/data-object-handler";
import { PKPrivate } from "./PKPrivate";

declare let $: any;

interface PKPublicGroupDataObject {
  groupId: string;
  dataObjectId: string;
}

export class PKPublic extends DataObjectStereotype {

  constructor(dataObjectHandler: DataObjectHandler) {
    super("PKPublic", dataObjectHandler);
    this.init();
  }

  group: string = null;
  selectedGroup: string = null;
  PKPublicAndPrivateGroupsDataObjects: PKPublicGroupDataObject[] = [];

  /** Functions inherited from DataObjectStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.dataObject.PKPublic != null) {
      return JSON.parse(this.dataObject.PKPublic);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // groupId
  getCurrentStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#PKPublic-groupSelect').val();
    return { groupId: group };
  }

  getGroup() {
    return this.group;
  }

  setGroup(name: string) {
    this.group = name;
  }

  initStereotypePublicView() {
    this.init();
    this.loadAllPKPublicAndPKPrivateGroupsDataObjects();
    super.initStereotypePublicView();
    this.highlightPKPublicAndPKPrivateGroupMembers(this.getGroup());
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
        this.PKPublicAndPrivateGroupsDataObjects.push({ groupId: this.selectedGroup, dataObjectId: this.dataObject.id });
      }
      selectedGroupId = this.selectedGroup;
    } else if (this.getSavedStereotypeSettings() != null) {
      selectedGroupId = this.getGroup();
      selected = this.getSavedStereotypeSettings();
    } else {
      if (this.PKPublicAndPrivateGroupsDataObjects.length > 0) {
        selectedGroupId = this.PKPublicAndPrivateGroupsDataObjects[0].groupId;
      }
    }

    this.highlightPKPublicAndPKPrivateGroupMembers(selectedGroupId);

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
        if (groupObject.id != this.dataObject.id && groupObject.businessObject.PKPrivate != null) {
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

    this.settingsPanelContainer.find('#PKPublic-dataObjectName').text(this.dataObject.name);
    this.settingsPanelContainer.find('#PKPublic-groupSelect').html(groups);
    this.settingsPanelContainer.find('#PKPublic-newGroup').html('');
    this.settingsPanelContainer.find('#PKPublic-otherGroupObjects').html(dataObjs);
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

  getGroupPKPublicElementName(group: string) {
    let dataObjects = this.getPKPublicAndPKPrivateGroupObjects(group);
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.PKPublic) {
          return dataObject.businessObject.name;
        }
      }
    }
    return null;
  }

  saveStereotypeSettings() {
    let self = this;
    let currentStereotypeSettings = this.getCurrentStereotypeSettings();
    let group = currentStereotypeSettings.groupId;
    if (group) {
      let dataObjects = this.getPKPublicAndPKPrivateGroupObjects(group);
      let dataObjectAlreadyInGroup = dataObjects.filter((obj) => {
        return obj.id == self.dataObject.id;
      });
      if (dataObjects.length === 2 && dataObjectAlreadyInGroup.length !== 1) {
        if (this.getGroupPKPublicElementName(group).trim() != this.dataObject.name.trim()) {
          this.settingsPanelContainer.find('#PKPublic-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#PKPublic-groupSelect-help2').show();
          return;
        }
      } else if (dataObjects.length === 1) {
        for (let dataObject of dataObjects) {
          if (dataObject.businessObject.PKPublic != null && dataObject.id != this.dataObject.id) {
            this.settingsPanelContainer.find('#PKPublic-groupSelect-form-group').addClass('has-error');
            this.settingsPanelContainer.find('#PKPublic-groupSelect-help2').show();
            return;
          }
        }
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.setGroup(group);
      this.PKPublicAndPrivateGroupsDataObjects = $.grep(this.PKPublicAndPrivateGroupsDataObjects, (el, idx) => { return el.dataObjectId == this.dataObject.id }, true);
      this.PKPublicAndPrivateGroupsDataObjects.push({ groupId: group, dataObjectId: this.dataObject.id });
      for (let dataObject of this.getPKPublicAndPKPrivateGroupObjects(group)) {
        if (dataObject.id == this.dataObject.id) {
          dataObject.businessObject.PKPublic = JSON.stringify(currentStereotypeSettings);
        }
      }
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#PKPublic-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#PKPublic-groupSelect-help').show();
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

  /** PKPublic class specific functions */
  init() {
    if (this.getSavedStereotypeSettings() != null) {
      this.setGroup(this.getSavedStereotypeSettings().groupId);
    }
  }

  loadAllPKPublicAndPKPrivateGroupsDataObjects() {
    this.PKPublicAndPrivateGroupsDataObjects = [];
    for (let dataObjectHandler of this.dataObjectHandler.getAllModelDataObjectHandlers()) {
      for (let stereotype of dataObjectHandler.stereotypes) {
        if (stereotype.getTitle() == "PKPublic" && (<PKPublic>stereotype).getGroup() != null) {
          this.PKPublicAndPrivateGroupsDataObjects.push({ groupId: (<PKPublic>stereotype).getGroup(), dataObjectId: stereotype.dataObject.id });
        }
        if (stereotype.getTitle() == "PKPrivate" && (<PKPrivate>stereotype).getGroup() != null) {
          this.PKPublicAndPrivateGroupsDataObjects.push({ groupId: (<PKPrivate>stereotype).getGroup(), dataObjectId: stereotype.dataObject.id });
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#PKPublic-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#PKPublic-newGroup').val();
      this.addPKPublicGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#PKPublic-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#PKPublic-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#PKPublic-groupSelect');
  }

  addPKPublicGroup(group: string) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#PKPublic-newGroup').val('');
      this.settingsPanelContainer.find('#PKPublic-otherGroupObjects').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#PKPublic-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#PKPublic-newGroup-help').show();
    }
  }

  reloadStereotypeSettingsWithSelectedGroup(group: string) {
    // Create temporary object to save current stereotype group
    let tmpObj = { groupId: this.getGroup() };
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

  highlightPKPublicAndPKPrivateGroupMembers(group: string) {
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

  getPKPublicAndPKPrivateGroupObjects(group: string) {
    let groupDataObjects = [];
    if (group) {
      let groups = $.grep(this.PKPublicAndPrivateGroupsDataObjects, function (el, idx) { return el.groupId.trim() == group.trim() }, false);
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
      groupDataObjectsIds.splice(groupDataObjectsIds.indexOf(this.dataObject.id), 1);
      return groupDataObjectsIds[0];
    }
    return null;
  }

  /** Validation functions */
  doesPairHaveKeysOfBothTypes() {
    let dataObjects = this.getPKPublicAndPKPrivateGroupObjects(this.getGroup());
    let PKPrivateKey = null;
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.PKPrivate) {
          PKPrivateKey = dataObject;
          break;
        }
      }
    }
    if (!PKPrivateKey) {
      return false;
    }
    return true;
  }

  getGroupPKPublicDataObjectsIds() {
    let PKPublicDataObjects = [];
    let dataObjects = this.getPKPublicAndPKPrivateGroupObjects(this.getGroup());
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.PKPublic) {
          PKPublicDataObjects.push(dataObject);
        }
      }
    }
    return PKPublicDataObjects.map(a => a.id);
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllPKPublicAndPKPrivateGroupsDataObjects();

    let savedData = this.getSavedStereotypeSettings();

    if (!this.doesPairHaveKeysOfBothTypes()) {
      this.addUniqueErrorToErrorsList(existingErrors, "PKPublic error: PKPrivate key is missing from the pair", this.getGroupPKPublicDataObjectsIds(), []);
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "PKPublic error: groupId is undefined", [this.dataObject.id], []);
    }
  }

}