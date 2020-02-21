import { ValidationErrorObject } from "../../handler/validation-handler";
import { DataObjectStereotype } from "../data-object-stereotype";
import { DataObjectHandler } from "../../handler/data-object-handler";
import { ABPrivate } from "./ABPrivate";

declare let $: any;

interface ABPublicGroupDataObject {
  groupId: string;
  dataObjectId: string;
}

export class ABPublic extends DataObjectStereotype {

  constructor(dataObjectHandler: DataObjectHandler) {
    super("ABPublic", dataObjectHandler);
    this.init();
  }

  group: string = null;
  selectedGroup: string = null;
  attributeSet: string = null;
  ABPublicAndPrivateGroupsDataObjects: ABPublicGroupDataObject[] = [];

  /** Functions inherited from DataObjectStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.dataObject.ABPublic != null) {
      return JSON.parse(this.dataObject.ABPublic);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // groupId
  // attributeSet
  getCurrentStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#ABPublic-groupSelect').val();
    let attributeSet = this.settingsPanelContainer.find('#ABPublic-attribute-set').val();
    return { groupId: group, attributeSet: attributeSet };
  }

  getGroup() {
    return this.group;
  }

  setGroup(name: string) {
    this.group = name;
  }

  initStereotypePublicView() {
    this.init();
    this.loadAllABPublicAndABPrivateGroupsDataObjects();
    super.initStereotypePublicView();
    this.highlightABPublicAndABPrivateGroupMembers(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();

    let selectedGroupId = null;
    let groups;
    let selected = null;
    let attributeSet = "";

    this.loadAllABPublicAndABPrivateGroupsDataObjects();

    if (this.selectedGroup != null) {
      if (this.getModelABPublicAndABPrivateGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no dataObjects in it yet, add current dataObject into it so its outputs would be highlighted
        this.ABPublicAndPrivateGroupsDataObjects.push({ groupId: this.selectedGroup, dataObjectId: this.dataObject.id });
      }
      selectedGroupId = this.selectedGroup;
      attributeSet = this.getGroupAttributeSet(selectedGroupId);
    } else if (this.getSavedStereotypeSettings() != null) {
      selectedGroupId = this.getGroup();
      selected = this.getSavedStereotypeSettings();
      attributeSet = selected.attributeSet;

    } else {
      if (this.ABPublicAndPrivateGroupsDataObjects.length > 0) {
        selectedGroupId = this.ABPublicAndPrivateGroupsDataObjects[0].groupId;
        attributeSet = this.getGroupAttributeSet(selectedGroupId);
      }
    }

    this.highlightABPublicAndABPrivateGroupMembers(selectedGroupId);

    for (let group of this.getModelABPublicAndABPrivateGroups()) {
      let sel = "";
      if (selectedGroupId !== null) {
        if (group.trim() == selectedGroupId.trim()) {
          sel = "selected";
        }
      }
      groups += '<option ' + sel + ' value="' + group + '">' + group + '</option>';
    }

    if (this.getModelABPublicAndABPrivateGroups().indexOf(this.selectedGroup) === -1 && this.selectedGroup != null) {
      // If selected group is new group that has no dataObjects in it yet, add it to the list of groups and select it
      groups += '<option selected value="' + this.selectedGroup + '">' + this.selectedGroup + '</option>';
    }

    let dataObjs = "";
    if (selectedGroupId !== null) {
      for (let groupObject of this.getABPublicAndABPrivateGroupObjects(selectedGroupId)) {
        if (groupObject.id != this.dataObject.id && groupObject.businessObject.ABPrivate != null) {
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

    this.settingsPanelContainer.find('#ABPublic-attribute-set').val(attributeSet);
    this.settingsPanelContainer.find('#ABPublic-dataObjectName').text(this.dataObject.name);
    this.settingsPanelContainer.find('#ABPublic-groupSelect').html(groups);
    this.settingsPanelContainer.find('#ABPublic-newGroup').html('');
    this.settingsPanelContainer.find('#ABPublic-otherGroupObjects').html(dataObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.removeAllABPublicAndABPrivateGroupsHighlights();
    this.ABPublicAndPrivateGroupsDataObjects = null;
    this.selectedGroup = null;
  }

  getGroupABPublicElementName(group: string) {
    let dataObjects = this.getABPublicAndABPrivateGroupObjects(group);
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.ABPublic) {
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
    let attributeSet = currentStereotypeSettings.attributeSet;
    let publicElementName = this.getGroupABPublicElementName(group) ? this.getGroupABPublicElementName(group) : null;
    if (group) {
      let dataObjects = this.getABPublicAndABPrivateGroupObjects(group);
      let dataObjectAlreadyInGroup = dataObjects.filter((obj) => {
        return obj.id == self.dataObject.id;
      });
      if (dataObjects.length >= 1 && dataObjectAlreadyInGroup.length !== 1) {
        if (publicElementName && publicElementName.trim() != this.dataObject.name.trim()) {
          this.settingsPanelContainer.find('#ABPublic-groupSelect-form-group').addClass('has-error');
          this.settingsPanelContainer.find('#ABPublic-groupSelect-help2').show();
          return;
        }
      } else if (dataObjects.length >= 1) {
        for (let dataObject of dataObjects) {
          if (dataObject.businessObject.ABPublic != null && dataObject.id != this.dataObject.id && publicElementName && publicElementName.trim() != this.dataObject.name.trim()) {
            this.settingsPanelContainer.find('#ABPublic-groupSelect-form-group').addClass('has-error');
            this.settingsPanelContainer.find('#ABPublic-groupSelect-help2').show();
            return;
          }
        }
      }
      if (attributeSet.length === 0) {
        this.settingsPanelContainer.find('#ABPublic-attribute-set-form-group').addClass('has-error');
        this.settingsPanelContainer.find('#ABPublic-attribute-set-help').show();
        this.initRemoveButton();
        return;
      }
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.setGroup(group);
      this.ABPublicAndPrivateGroupsDataObjects = $.grep(this.ABPublicAndPrivateGroupsDataObjects, (el, idx) => { return el.dataObjectId == this.dataObject.id }, true);
      this.ABPublicAndPrivateGroupsDataObjects.push({ groupId: group, dataObjectId: this.dataObject.id });
      for (let dataObject of this.getABPublicAndABPrivateGroupObjects(group)) {
        if (dataObject.id == this.dataObject.id || dataObject.businessObject.ABPublic != null) {
          dataObject.businessObject.ABPublic = JSON.stringify(currentStereotypeSettings);
        } else if (dataObject.businessObject.ABPrivate != null) {
          dataObject.businessObject.ABPrivate = JSON.stringify({ groupId: group, attributeSet: attributeSet, attributeSubSet: JSON.parse(dataObject.businessObject.ABPrivate).attributeSubSet });
        }
      }
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#ABPublic-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#ABPublic-groupSelect-help').show();
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

  /** ABPublic class specific functions */
  init() {
    if (this.getSavedStereotypeSettings() != null) {
      this.setGroup(this.getSavedStereotypeSettings().groupId);
    }
  }

  loadAllABPublicAndABPrivateGroupsDataObjects() {
    this.ABPublicAndPrivateGroupsDataObjects = [];
    for (let dataObjectHandler of this.dataObjectHandler.getAllModelDataObjectHandlers()) {
      for (let stereotype of dataObjectHandler.stereotypes) {
        if (stereotype.getTitle() == "ABPublic" && (<ABPublic>stereotype).getGroup() != null) {
          this.ABPublicAndPrivateGroupsDataObjects.push({ groupId: (<ABPublic>stereotype).getGroup(), dataObjectId: stereotype.dataObject.id });
        }
        if (stereotype.getTitle() == "ABPrivate" && (<ABPrivate>stereotype).getGroup() != null) {
          this.ABPublicAndPrivateGroupsDataObjects.push({ groupId: (<ABPrivate>stereotype).getGroup(), dataObjectId: stereotype.dataObject.id });
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#ABPublic-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#ABPublic-newGroup').val();
      this.addABPublicGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#ABPublic-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#ABPublic-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#ABPublic-groupSelect');
  }

  addABPublicGroup(group: string) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group);
      this.settingsPanelContainer.find('#ABPublic-newGroup').val('');
      this.settingsPanelContainer.find('#ABPublic-otherGroupObjects').html('');
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#ABPublic-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#ABPublic-newGroup-help').show();
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

  highlightABPublicAndABPrivateGroupMembers(group: string) {
    for (let i = 0; i < this.ABPublicAndPrivateGroupsDataObjects.length; i++) {
      let groupId = this.ABPublicAndPrivateGroupsDataObjects[i].groupId;
      let dataObjectId = this.ABPublicAndPrivateGroupsDataObjects[i].dataObjectId;
      if (groupId.trim() == group.trim()) {
        this.canvas.addMarker(dataObjectId, 'highlight-group');
      }
    }
  }

  removeAllABPublicAndABPrivateGroupsHighlights() {
    if (this.ABPublicAndPrivateGroupsDataObjects) {
      for (let i = 0; i < this.ABPublicAndPrivateGroupsDataObjects.length; i++) {
        let dataObjectId = this.ABPublicAndPrivateGroupsDataObjects[i].dataObjectId;
        this.canvas.removeMarker(dataObjectId, 'highlight-group');
      }
    }
  }

  getModelABPublicAndABPrivateGroups() {
    let difGroups = [];
    for (let i = 0; i < this.ABPublicAndPrivateGroupsDataObjects.length; i++) {
      if (difGroups.indexOf(this.ABPublicAndPrivateGroupsDataObjects[i].groupId) === -1) {
        difGroups.push(this.ABPublicAndPrivateGroupsDataObjects[i].groupId);
      }
    }
    return difGroups;
  }

  getABPublicAndABPrivateGroupObjects(group: string) {
    let groupDataObjects = [];
    if (group) {
      let groups = $.grep(this.ABPublicAndPrivateGroupsDataObjects, function (el, idx) { return el.groupId.trim() == group.trim() }, false);
      for (let i = 0; i < groups.length; i++) {
        groupDataObjects.push(this.registry.get(groups[i].dataObjectId));
      }
    }
    return groupDataObjects;
  }

  getGroupAttributeSet(group: string) {
    let attributeSet = "";
    if (group != null) {
      let groupDataObjects = this.getABPublicAndABPrivateGroupObjects(group);
      if (groupDataObjects.length === 1) {
        if (groupDataObjects[0].businessObject.ABPublic != null) {
          attributeSet = JSON.parse(groupDataObjects[0].businessObject.ABPublic).attributeSet;
        } else if (groupDataObjects[0].businessObject.ABPrivate != null) {
          attributeSet = JSON.parse(groupDataObjects[0].businessObject.ABPrivate).attributeSet;
        }
      } else {
        for (let groupDataObject of groupDataObjects) {
          if (groupDataObject.id != this.dataObject.id) {
            if (groupDataObject.businessObject.ABPublic != null) {
              attributeSet = JSON.parse(groupDataObject.businessObject.ABPublic).attributeSet;
              break;
            } else if (groupDataObject.businessObject.ABPrivate != null) {
              attributeSet = JSON.parse(groupDataObject.businessObject.ABPrivate).attributeSet;
              break;
            }
          }
        }
      }
    }
    return attributeSet;
  }

  /** Validation functions */
  doesPairHaveKeysOfBothTypes() {
    let dataObjects = this.getABPublicAndABPrivateGroupObjects(this.getGroup());
    let ABPrivateKey = null;
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.ABPrivate) {
          ABPrivateKey = dataObject;
          break;
        }
      }
    }
    if (!ABPrivateKey) {
      return false;
    }
    return true;
  }

  getGroupABPublicDataObjects() {
    let ABPublicDataObjects = [];
    let dataObjects = this.getABPublicAndABPrivateGroupObjects(this.getGroup());
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.ABPublic) {
          ABPublicDataObjects.push(dataObject);
        }
      }
    }
    return ABPublicDataObjects;
  }

  areGroupABPublicElementsAllWithTheSameName() {
    let dataObjects = this.getGroupABPublicDataObjects();
    if (dataObjects.length > 1 && this.validationHandler.areNamesUnique(dataObjects)) {
      return false;
    }
    return true;
  }

  areGroupABPublicElementsAllWithTheSameAttributesSet() {
    let dataObjects = this.getGroupABPublicDataObjects();
    let tmpArr = [];
    for (let obj of dataObjects) {
      if (tmpArr.indexOf(JSON.parse(obj.businessObject.ABPublic).attributeSet) < 0) {
        tmpArr.push(JSON.parse(obj.businessObject.ABPublic).attributeSet);
      }
    }
    if (dataObjects.length > 0 && tmpArr.length > 1) {
      return false;
    }
    return true;
  }

  isAttributeSetNotEmpty() {
    let savedData = this.getSavedStereotypeSettings();
    if (savedData.attributeSet.length === 0) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllABPublicAndABPrivateGroupsDataObjects();

    let savedData = this.getSavedStereotypeSettings();

    if (!this.doesPairHaveKeysOfBothTypes()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPublic error: ABPrivate key is missing from the group", this.getGroupABPublicDataObjects().map(a => a.id), []);
    }
    if (!this.areGroupABPublicElementsAllWithTheSameName()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPublic error: All ABPublic keys in the same group must have the same name", this.getGroupABPublicDataObjects().map(a => a.id), []);
    }
    if (!this.areGroupABPublicElementsAllWithTheSameAttributesSet()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPublic error: All ABPublic keys in the same group must have the same attributes set", this.getGroupABPublicDataObjects().map(a => a.id), []);
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPublic error: groupId is undefined", [this.dataObject.id], []);
    }
    if (typeof savedData.attributeSet == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPublic error: attributeSet is undefined", [this.dataObject.id], []);
    } else {
      if (!this.isAttributeSetNotEmpty()) {
        this.addUniqueErrorToErrorsList(existingErrors, "ABPublic error: attribute set must not be empty", [this.dataObject.id], []);
      }
    }
  }

}