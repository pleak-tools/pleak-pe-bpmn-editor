import { ValidationErrorObject } from "../../handler/validation-handler";
import { DataObjectStereotype } from "../data-object-stereotype";
import { DataObjectHandler } from "../../handler/data-object-handler";
import { ABPublic } from "./ABPublic";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

interface ABPrivateGroupDataObject {
  groupId: string;
  dataObjectId: string;
}

export class ABPrivate extends DataObjectStereotype {

  constructor(dataObjectHandler: DataObjectHandler) {
    super("ABPrivate", dataObjectHandler);
    this.init();
  }

  group: string = null;
  selectedGroup: string = null;
  attributeSet: string = null;
  ABPublicAndPrivateGroupsDataObjects: ABPrivateGroupDataObject[] = [];

  /** Functions inherited from DataObjectStereotype and Stereotype classes */
  getTitle() {
    return super.getTitle();
  }

  getSavedStereotypeSettings() {
    if (this.dataObject.ABPrivate != null) {
      return JSON.parse(this.dataObject.ABPrivate);
    } else {
      return null;
    }
  }

  // Returns an object with properties:
  // groupId
  // attributeSet
  // attributeSubSet
  getCurrentStereotypeSettings() {
    let group = this.settingsPanelContainer.find('#ABPrivate-groupSelect').val();
    let attributeSet = this.settingsPanelContainer.find('#ABPrivate-attribute-set-temp').val();
    let attributeSubSetTmp = this.settingsPanelContainer.find("input:checkbox[name='ABPrivate-attribute-subset-item']:checked").map(function (_, el) {
      return $(el).val();
    }).get();
    let attributeSubSet = [];
    for (let attribute of attributeSubSetTmp) {
      if (attributeSet.indexOf(attribute) !== -1) {
        attributeSubSet.push(attribute);
      }
    }
    return { groupId: group, attributeSet: attributeSet, attributeSubSet: attributeSubSet };
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
    this.highlightABPublicAndABPrivateGroupMembersAndTheirInputsOutputs(this.getGroup());
  }

  initStereotypeSettings() {

    super.initStereotypeSettings();
    this.initAddGroupButton();
    this.initGroupSelectDropdown();
    this.initUpdateAttributeSetButton();

    let selectedGroupId = null;
    let groups;
    let selected = null;
    let attributeSet = "";
    let attributeSubSet = [];
    let attributeSubSetHtml = "";

    this.loadAllABPublicAndABPrivateGroupsDataObjects();

    if (this.selectedGroup != null) {
      if (this.getModelABPublicAndABPrivateGroups().indexOf(this.selectedGroup) === -1) {
        // If selected group is new group that has no dataObjects in it yet, add current dataObject into it so its outputs would be highlighted
        this.ABPublicAndPrivateGroupsDataObjects.push({ groupId: this.selectedGroup, dataObjectId: this.dataObject.id });
      }
      selectedGroupId = this.selectedGroup;
      attributeSet = this.getGroupAttributeSet(selectedGroupId);
      if (this.getSavedStereotypeSettings() != null) {
        if (this.getSavedStereotypeSettings().attributeSubSet && this.getSavedStereotypeSettings().attributeSubSet.length > 0) {
          attributeSubSet = this.getSavedStereotypeSettings().attributeSubSet;
        }
      }

    } else if (this.getSavedStereotypeSettings() != null) {
      selectedGroupId = this.getGroup();
      selected = this.getSavedStereotypeSettings();
      attributeSet = selected.attributeSet;
      attributeSubSet = selected.attributeSubSet;
    } else {
      if (this.ABPublicAndPrivateGroupsDataObjects.length > 0) {
        selectedGroupId = this.ABPublicAndPrivateGroupsDataObjects[0].groupId;
        attributeSet = this.getGroupAttributeSet(selectedGroupId);
      }
    }

    if (this.attributeSet != null) {
      attributeSet = this.attributeSet;
      attributeSubSet = [];
    }

    if (attributeSet && attributeSet.length > 0) {
      let attributes = attributeSet.split(",");
      for (let attribute of attributes) {
        if (attribute.length > 0) {
          let checked = "";
          if (attributeSubSet.indexOf(attribute) !== -1) {
            checked = "checked";
          }
          attributeSubSetHtml += '<input type="checkbox" class="ABPrivate-attribute-subset-item" name="ABPrivate-attribute-subset-item" value="' + attribute + '" ' + checked + '> ' + attribute + '<br/>';
        }
      }
      if (attributeSubSet && attributeSubSet.length > 0) {
        let attributes = attributeSet.split(",");
        for (let attribute of attributeSubSet) {
          if (attribute.length > 0 && attributes.indexOf(attribute) === -1) {
            attributeSubSetHtml += '<input type="checkbox" class="ABPrivate-attribute-subset-item" name="ABPrivate-attribute-subset-item" value="' + attribute + '" checked> ' + attribute + '<br/>';
          }
        }
      }
    } else if (attributeSubSet && attributeSubSet.length > 0) {
      for (let attribute of attributeSubSet) {
        if (attribute.length > 0) {
          attributeSubSetHtml += '<input type="checkbox" class="ABPrivate-attribute-subset-item" name="ABPrivate-attribute-subset-item" value="' + attribute + '" checked> ' + attribute + '<br/>';
        }
      }
    }

    this.highlightABPublicAndABPrivateGroupMembersAndTheirInputsOutputs(selectedGroupId);

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
        if (groupObject.id != this.dataObject.id && groupObject.businessObject.ABPublic != null) {
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

    //if (attributeSubSetHtml.length > 0) {
    this.settingsPanelContainer.find('#ABPrivate-attribute-subset').html(attributeSubSetHtml);
    $('#ABPrivate-attribute-subset-form-group').show();
    //}

    this.settingsPanelContainer.find('#ABPrivate-attribute-set, #ABPrivate-attribute-set-temp').val(attributeSet);
    this.settingsPanelContainer.find('#ABPrivate-dataObjectName').text(this.dataObject.name);
    this.settingsPanelContainer.find('#ABPrivate-groupSelect').html(groups);
    this.settingsPanelContainer.find('#ABPrivate-newGroup').html('');
    this.settingsPanelContainer.find('#ABPrivate-otherGroupObjects').html(dataObjs);
    this.settingsPanelContainer.show();
  }

  terminateStereotypeSettings() {
    super.terminateStereotypeSettings();
    this.terminateAddGroupButton();
    this.terminateGroupSelectDropdown();
    this.terminateUpdateAttributeSetButton();
    this.removeAllABPublicAndABPrivateGroupsHighlights();
    this.ABPublicAndPrivateGroupsDataObjects = null;
    this.selectedGroup = null;
    this.attributeSet = null;
    this.settingsPanelContainer.find('#ABPrivate-attribute-set').val('');
    this.settingsPanelContainer.find('#ABPrivate-attribute-set-temp').val('');
    this.settingsPanelContainer.find('#ABPrivate-attribute-subset').html('');
    this.settingsPanelContainer.find('#ABPrivate-attribute-subset-form-group').hide();
  }

  getGroupABPrivateElementName(group: string) {
    let dataObjects = this.getABPublicAndABPrivateGroupObjects(group);
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.ABPrivate) {
          return dataObject.businessObject.name;
        }
      }
    }
    return null;
  }

  saveStereotypeSettings() {
    let currentStereotypeSettings = this.getCurrentStereotypeSettings();
    let group = currentStereotypeSettings.groupId;
    let attributeSet = currentStereotypeSettings.attributeSet;
    if (group) {
      if (this.getSavedStereotypeSettings() == null) {
        this.addStereotypeToElement();
      }
      this.setGroup(group);
      this.ABPublicAndPrivateGroupsDataObjects = $.grep(this.ABPublicAndPrivateGroupsDataObjects, (el, idx) => { return el.dataObjectId == this.dataObject.id }, true);
      this.ABPublicAndPrivateGroupsDataObjects.push({ groupId: group, dataObjectId: this.dataObject.id });
      for (let dataObject of this.getABPublicAndABPrivateGroupObjects(group)) {
        if (dataObject.businessObject.ABPublic != null) {
          dataObject.businessObject.ABPublic = JSON.stringify({ groupId: group, attributeSet: attributeSet });
        } else if (dataObject.id == this.dataObject.id) {
          dataObject.businessObject.ABPrivate = JSON.stringify(currentStereotypeSettings);
        } else if (dataObject.businessObject.ABPrivate != null && dataObject.id != this.dataObject.id) {
          let attributeSubSet2 = [];
          for (let attribute of JSON.parse(dataObject.businessObject.ABPrivate).attributeSubSet) {
            if (attributeSet.indexOf(attribute) !== -1) {
              attributeSubSet2.push(attribute);
            }
          }
          dataObject.businessObject.ABPrivate = JSON.stringify({ groupId: group, attributeSet: attributeSet, attributeSubSet: attributeSubSet2 });
        }
      }
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
      return true;
    } else {
      this.settingsPanelContainer.find('#ABPrivate-groupSelect-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#ABPrivate-groupSelect-help').show();
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

  /** ABPrivate class specific functions */
  init() {
    if (this.getSavedStereotypeSettings() != null) {
      this.setGroup(this.getSavedStereotypeSettings().groupId);
    }
  }

  loadAllABPublicAndABPrivateGroupsDataObjects() {
    this.ABPublicAndPrivateGroupsDataObjects = [];
    for (let dataObjectHandler of this.dataObjectHandler.getAllModelDataObjectHandlers()) {
      for (let stereotype of dataObjectHandler.stereotypes) {
        if (stereotype.getTitle() == "ABPrivate" && (<ABPrivate>stereotype).getGroup() != null) {
          this.ABPublicAndPrivateGroupsDataObjects.push({ groupId: (<ABPrivate>stereotype).getGroup(), dataObjectId: stereotype.dataObject.id });
        }
        if (stereotype.getTitle() == "ABPublic" && (<ABPublic>stereotype).getGroup() != null) {
          this.ABPublicAndPrivateGroupsDataObjects.push({ groupId: (<ABPublic>stereotype).getGroup(), dataObjectId: stereotype.dataObject.id });
        }
      }
    }
  }

  initAddGroupButton() {
    this.settingsPanelContainer.one('click', '#ABPrivate-add-button', (e) => {
      let group = this.settingsPanelContainer.find('#ABPrivate-newGroup').val();
      this.addABPrivateGroup(group);
    });
  }

  terminateAddGroupButton() {
    this.settingsPanelContainer.off('click', '#ABPrivate-add-button');
  }

  initGroupSelectDropdown() {
    this.settingsPanelContainer.one('change', '#ABPrivate-groupSelect', (e) => {
      this.reloadStereotypeSettingsWithSelectedGroup(e.target.value, null);
    });

  }

  terminateGroupSelectDropdown() {
    this.settingsPanelContainer.off('change', '#ABPrivate-groupSelect');
  }

  initUpdateAttributeSetButton() {
    this.settingsPanelContainer.one('click', '#ABPrivate-attribute-set-update-button', (e) => {
      this.updateAttributeSet();
    });
  }

  terminateUpdateAttributeSetButton() {
    this.settingsPanelContainer.off('click', '#ABPrivate-attribute-set-update-button');
  }

  addABPrivateGroup(group: string) {
    if (group) {
      this.reloadStereotypeSettingsWithSelectedGroup(group, null);
      this.settingsPanelContainer.find('#ABPrivate-newGroup').val('');
      this.settingsPanelContainer.find('#ABPrivate-attribute-set').val('');
      this.settingsPanelContainer.find('#ABPrivate-attribute-set-temp').val('');
      this.settingsPanelContainer.find('#ABPrivate-otherGroupObjects').html('');
      this.settingsPanelContainer.find('#ABPrivate-attribute-subset').html('');
      this.settingsPanelContainer.find('#ABPrivate-attribute-subset-form-group').hide();
      this.settingsPanelContainer.find('.form-group').removeClass('has-error');
      this.settingsPanelContainer.find('.help-block').hide();
    } else {
      this.initAddGroupButton();
      this.settingsPanelContainer.find('#ABPrivate-newGroup-form-group').addClass('has-error');
      this.settingsPanelContainer.find('#ABPrivate-newGroup-help').show();
    }
  }

  updateAttributeSet() {
    let attributeSet = this.settingsPanelContainer.find('#ABPrivate-attribute-set').val();
    let group = this.settingsPanelContainer.find('#ABPrivate-groupSelect').val();

    this.settingsPanelContainer.find('#ABPrivate-attribute-set-temp').val(attributeSet);
    this.reloadStereotypeSettingsWithSelectedGroup(group, attributeSet);
  }

  reloadStereotypeSettingsWithSelectedGroup(group: string, attributes: string) {
    // Create temporary object to save current stereotype group
    let tmpObj = { groupId: this.getGroup() };
    let currentGroupObj = $.extend({}, tmpObj);

    // Terminate current dataObject stereotype settings
    this.terminateStereotypeSettings();

    // Set selected group temporarily to new selected group to init stereotype settings based on new group
    this.selectedGroup = group;
    this.attributeSet = attributes;

    if (currentGroupObj.groupId != null) {
      this.initAllElementStereotypesSettings();
    } else {
      this.initAllElementStereotypesSettings();
      this.initStereotypeSettings();
    }

    // Set selected group back to null (in case new group is not going to be saved)
    this.selectedGroup = null;
    this.attributeSet = null;
  }

  highlightABPublicAndABPrivateGroupMembersAndTheirInputsOutputs(group: string) {
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
      let groups = $.grep(this.ABPublicAndPrivateGroupsDataObjects, function (el, idx) { return el.groupId == group }, false);
      for (let i = 0; i < groups.length; i++) {
        groupDataObjects.push(this.registry.get(groups[i].dataObjectId));
      }
    }
    return groupDataObjects;
  }

  getGroupSecondElementId() {
    let groupDataObjects = this.getABPublicAndABPrivateGroupObjects(this.getGroup());
    let groupDataObjectsIds = groupDataObjects.map(a => a.id);
    if (groupDataObjectsIds.length === 2) {
      groupDataObjectsIds.splice(groupDataObjectsIds.indexOf(this.dataObject.id), 1);
      return groupDataObjectsIds[0];
    }
    return null;
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
    let ABPublicKey = null;
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.ABPublic) {
          ABPublicKey = dataObject;
          break;
        }
      }
    }
    if (ABPublicKey === null) {
      return false;
    }
    return true;
  }

  getGroupABPrivateDataObjects() {
    let ABPrivateDataObjects = [];
    let dataObjects = this.getABPublicAndABPrivateGroupObjects(this.getGroup());
    if (dataObjects.length > 0) {
      for (let dataObject of dataObjects) {
        if (dataObject.businessObject.ABPrivate) {
          ABPrivateDataObjects.push(dataObject);
        }
      }
    }
    return ABPrivateDataObjects;
  }

  isAttributeSubSetInAttributeSet() {
    let savedData = this.getSavedStereotypeSettings();
    if (savedData && typeof savedData.attributeSet !== 'undefined' && typeof savedData.attributeSubSet !== 'undefined') {
      if (savedData.attributeSubSet.length !== 0) {
        let attributes = savedData.attributeSet.split(",");
        for (let attribute of savedData.attributeSubSet) {
          if (attributes.indexOf(attribute) === -1) {
            return false;
          }
        }
      }
    }
    return true;
  }

  areGroupABPrivateElementsAllWithTheSameAttributesSet() {
    let dataObjects = this.getGroupABPrivateDataObjects();
    let tmpArr = [];
    for (let obj of dataObjects) {
      if (tmpArr.indexOf(JSON.parse(obj.businessObject.ABPrivate).attributeSet) < 0) {
        tmpArr.push(JSON.parse(obj.businessObject.ABPrivate).attributeSet);
      }
    }
    if (dataObjects.length > 0 && tmpArr.length > 1) {
      return false;
    }
    return true;
  }

  getGroupABPrivateElementsWithTheSameName() {
    let dataObjects = this.getGroupABPrivateDataObjects();
    let tmpArray1 = [];
    let tmpArray2 = [];
    let tmpArray3 = [];

    for (let dataObjectName of dataObjects.map(a => a.businessObject.name.trim())) {
      if (tmpArray1.indexOf(dataObjectName) === -1) {
        tmpArray1.push(dataObjectName);
      } else {
        tmpArray2.push(dataObjectName);
      }
    }

    for (let dataObject of dataObjects) {
      for (let dataObjectName of tmpArray2) {
        if (dataObject.businessObject.name.trim() == dataObjectName && tmpArray3.map(a => a.id).indexOf(dataObject.id) === -1) {
          tmpArray3.push(dataObject);
        }
      }
    }

    return tmpArray3;
  }

  areTheSameGroupABPrivateElementsAllWithTheSameAttributesSubSet() {
    let groupABPrivateDataObjects = this.getGroupABPrivateElementsWithTheSameName();
    let tmpArray = [];
    for (let obj of groupABPrivateDataObjects) {
      if (tmpArray.indexOf(JSON.parse(obj.businessObject.ABPrivate).attributeSubSet.toString()) < 0) {
        tmpArray.push(JSON.parse(obj.businessObject.ABPrivate).attributeSubSet.toString());
      }
    }
    if (groupABPrivateDataObjects.length > 0 && tmpArray.length > 1) {
      return false;
    }
    return true;
  }

  checkForErrors(existingErrors: ValidationErrorObject[]) {
    this.init();
    this.loadAllABPublicAndABPrivateGroupsDataObjects();

    let savedData = this.getSavedStereotypeSettings();

    if (!this.doesPairHaveKeysOfBothTypes()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPrivate error: ABPublic key is missing from the group", this.getGroupABPrivateDataObjects().map(a => a.id), []);
    }
    if (typeof savedData.groupId == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPrivate error: groupId is undefined", [this.dataObject.id], []);
    }
    if (typeof savedData.attributeSet == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPrivate error: attributeSet is undefined", [this.dataObject.id], []);
    }
    if (typeof savedData.attributeSubSet == 'undefined') {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPrivate error: attributeSubSet is undefined", [this.dataObject.id], []);
    }
    if (!this.isAttributeSubSetInAttributeSet()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPrivate error: all attributes in the attributes subset must be also in the attributes set", [this.dataObject.id], []);
    }
    if (!this.areGroupABPrivateElementsAllWithTheSameAttributesSet()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPrivate error: All ABPrivate keys in the same group must have the same attributes set", this.getGroupABPrivateDataObjects().map(a => a.id), []);
    }
    if (!this.areTheSameGroupABPrivateElementsAllWithTheSameAttributesSubSet()) {
      this.addUniqueErrorToErrorsList(existingErrors, "ABPrivate error: All same ABPrivate keys (with the same name) in the same group must have the same attributes subset", this.getGroupABPrivateElementsWithTheSameName().map(a => a.id), []);
    }
  }

}