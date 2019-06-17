import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler } from "./validation-handler";
import { DataObjectStereotype } from "../stereotype/data-object-stereotype";
import { PKPublic } from "../stereotype/stereotypes/PKPublic";
import { PKPrivate } from "../stereotype/stereotypes/PKPrivate";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class DataObjectHandler {

  constructor(elementsHandler: ElementsHandler, dataObject: any) {
    this.viewer = elementsHandler.viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.canvas = this.viewer.get('canvas');
    this.overlays = this.viewer.get('overlays');

    this.elementsHandler = elementsHandler;
    this.validationHandler = elementsHandler.validationHandler;
    this.dataObject = dataObject;

    this.init();
  }

  beingEdited: Boolean = false;

  viewer: Viewer;
  registry: any;
  canvas: any;
  overlays: any;

  elementsHandler: ElementsHandler;
  validationHandler: ValidationHandler;
  dataObject: any;
  parentLaneOrPool: any;
  incomingParentTasks: any[] = [];
  outgoingParentTasks: any[] = [];
  tasksVisibleTo: any[] = [];
  visibilityStatus: any[] = [];
  dataObjectType: string;

  stereotypes: DataObjectStereotype[] = [];
  stereotypeSelector: string = null;
  stereotypeSelectorHidden: Boolean = false;
  tempStereotype: DataObjectStereotype = null;

  supportedStereotypes: string[] = [
    "PKPublic",
    "PKPrivate"
  ];

  getDataObjectId() {
    return this.dataObject.id;
  }

  getName() {
    return this.dataObject.name;
  }

  getDataObjectParentLaneOrPool() {
    return this.parentLaneOrPool;
  }

  getLanesAndPoolsDataObjectIsVisibleTo() {
    return this.tasksVisibleTo;
  }

  getDataObjectParentTasks() {
    return this.incomingParentTasks.concat(this.outgoingParentTasks);
  }

  getDataObjectIncomingParentTasks() {
    this.loadIncomingParentTasks();
    return this.incomingParentTasks;
  }

  getDataObjectOutgoingParentTasks() {
    this.loadOutgoingParentTasks();
    return this.outgoingParentTasks;
  }

  getVisibilityStatus() {
    return this.visibilityStatus;
  }

  getDataObjectType() {
    return this.dataObjectType;
  }

  init() {
    // Add stereotype instances to the dataObject (based on xml of the model)
    for (let sType of this.supportedStereotypes) {
      if (this.dataObject[(<any>sType)] != null) {
        let stInstance = this.createStereotypeByName(sType);
        this.addStereotypeToDataObject(stInstance);
      }
    }
    this.loadDataObjectStereotypes();
  }

  prepareAnalysisDetails(): void {
    this.loadParentLaneOrPool();
    this.loadIncomingParentTasks();
    this.loadOutgoingParentTasks();
    this.loadLanesAndPoolsToWhichDataObjectIsVisibleTo();
    this.loadDataObjectVisibilityStatus();
    this.loadDataObjectType();
  }

  loadDataObjectType() {
    if (this.registry.get(this.dataObject.id) && this.registry.get(this.dataObject.id).incoming.length > 0 && this.registry.get(this.dataObject.id).outgoing.length > 0) {
      this.dataObjectType = "input-output";
    } else if (this.registry.get(this.dataObject.id) && this.registry.get(this.dataObject.id).incoming.length > 0) {
      this.dataObjectType = "output";
    } else if (this.registry.get(this.dataObject.id) && this.registry.get(this.dataObject.id).outgoing.length > 0) {
      this.dataObjectType = "input";
    }
  }

  // Load data object's parent lane/pool information
  loadParentLaneOrPool() {
    this.parentLaneOrPool = null;
    if (this.registry.get(this.dataObject.id).parent && this.registry.get(this.registry.get(this.dataObject.id).parent.id)) {
      this.parentLaneOrPool = this.registry.get(this.registry.get(this.dataObject.id).parent.id).businessObject;
    }
  }

  // Load data object's incoming "parents" (tasks) information
  loadIncomingParentTasks() {
    let parentTasks = [];
    if (this.registry.get(this.dataObject.id) && this.registry.get(this.dataObject.id).incoming) {
      for (let incoming of this.registry.get(this.dataObject.id).incoming) {
        if (incoming.businessObject && incoming.businessObject.$parent && incoming.businessObject.$parent.$type === "bpmn:Task") {
          parentTasks.push(incoming.businessObject.$parent);
        }
      }
    }
    this.incomingParentTasks = parentTasks;
  }

  // Load data object's outgoing "parents" (tasks) information
  loadOutgoingParentTasks() {
    let parentTasks = [];
    if (this.registry.get(this.dataObject.id) && this.registry.get(this.dataObject.id).outgoing) {
      for (let outgoing of this.registry.get(this.dataObject.id).outgoing) {
        if (outgoing.businessObject && outgoing.businessObject.$parent && outgoing.businessObject.$parent.$type === "bpmn:Task") {
          parentTasks.push(outgoing.businessObject.$parent);
        }
      }
    }
    this.outgoingParentTasks = parentTasks;
  }

  // Load information about lanes/pools to which the data objects is visible to
  loadLanesAndPoolsToWhichDataObjectIsVisibleTo() {
    let tasksVisibleTo = [];
    if (this.registry.get(this.dataObject.id) && this.registry.get(this.dataObject.id).incoming) {
      for (let incoming of this.registry.get(this.dataObject.id).incoming) {
        if (incoming.businessObject && incoming.businessObject.$parent && incoming.businessObject.$parent.$type === "bpmn:Task") {
          if (this.registry.get(incoming.businessObject.$parent.id).businessObject.lanes) {
            tasksVisibleTo.push(this.registry.get(incoming.businessObject.$parent.id).businessObject.lanes[0].id);
          }
          if (!this.registry.get(incoming.businessObject.$parent.id).businessObject.lanes && this.registry.get(incoming.businessObject.$parent.id).parent) {
            tasksVisibleTo.push(this.registry.get(incoming.businessObject.$parent.id).parent.id);
          }
        }
      }
    }
    if (this.registry.get(this.dataObject.id) && this.registry.get(this.dataObject.id).outgoing) {
      for (let outgoing of this.registry.get(this.dataObject.id).outgoing) {
        if (outgoing.businessObject && outgoing.businessObject.$parent && outgoing.businessObject.$parent.$type === "bpmn:Task") {
          if (this.registry.get(outgoing.businessObject.$parent.id)) {
            if (this.registry.get(outgoing.businessObject.$parent.id).businessObject.lanes) {
              tasksVisibleTo.push(this.registry.get(outgoing.businessObject.$parent.id).businessObject.lanes[0].id);
            }
            if (!this.registry.get(outgoing.businessObject.$parent.id).businessObject.lanes && this.registry.get(outgoing.businessObject.$parent.id).parent) {
              tasksVisibleTo.push(this.registry.get(outgoing.businessObject.$parent.id).parent.id);
            }
          }
        }
      }
    }
    if (tasksVisibleTo.length === 0) {
      tasksVisibleTo.push(this.parentLaneOrPool.id);
    }
    this.tasksVisibleTo = tasksVisibleTo;
  }

  // Load visibility status of data object
  loadDataObjectVisibilityStatus() {
    let statuses = [];
    for (let parentTask of this.getDataObjectParentTasks()) {
      let status = this.elementsHandler.getTaskHandlerByTaskId(parentTask.id).getDataObjectVisibilityStatus(this.dataObject.id);
      if (status) {
        statuses = statuses.concat(status);
      }
    }
    this.visibilityStatus = this.visibilityStatus.concat(statuses);
  }

  // Add already existing stereotype labels to the model
  loadDataObjectStereotypes() {
    if (this.stereotypes.length > 0) {
      for (let stereotype of this.stereotypes) {
        this.addStereotypeLabelToElement(stereotype.getTitle());
      }
    }
  }

  // Start dataObject editing (stereotype adding) process
  initStereotypeEditProcess() {
    if (this.stereotypeSelector == null) {
      this.initDataObjectStereotypeSelector();
    }
    this.initElementStereotypeSettings();
    this.initStereotypeSettingsPanel();
    this.canvas.addMarker(this.dataObject.id, 'selected');
    this.beingEdited = true;
  }

  // Start stereotype public view for the viewer
  initPublicStereotypeView() {
    for (let sType of this.stereotypes) {
      sType.initStereotypePublicView();
    }
    this.initElementStereotypeSettings();
    this.beingEdited = false;
    this.stereotypeSelectorHidden = true;
    this.stereotypeSelector = null;
  }

  // End dataObject editing (stereotype adding) process
  terminateStereotypeEditProcess() {
    this.terminateDataObjectStereotypeSelector();
    this.terminateDataObjectStereotypeSettings();
    this.terminateStereotypeSettingsPanel();
    this.canvas.removeMarker(this.dataObject.id, 'selected');
    this.beingEdited = false;
    this.stereotypeSelectorHidden = false;
  }

  // Init settings panels for all already added stereotypes
  initElementStereotypeSettings() {
    for (let sType of this.stereotypes) {
      sType.isTempStereotype = false;
      sType.loadStereotypeTemplateAndInitStereotypeSettings();
    }
  }

  // Hide settings panels for all already added stereotypes
  terminateDataObjectStereotypeSettings() {
    for (let sType of this.stereotypes) {
      sType.terminateStereotypeSettings();
    }
    if (this.tempStereotype != null) {
      this.tempStereotype.terminateStereotypeSettings();
      this.tempStereotype = null;
    }
  }

  areThereUnsavedDataObjectChanges() {
    if (this.tempStereotype == null) {
      for (let stereotype of this.stereotypes) {
        if (stereotype.areThereUnsavedChanges()) {
          return true;
        }
      }
      return false;
    } else {
      return true;
    }
  }

  checkForUnsavedChanges() {
    if (this.areThereUnsavedDataObjectChanges()) {
      if (confirm('Are you sure you wish to revert unsaved stereotype settings?')) {
        this.terminateStereotypeEditProcess();
      } else {
        this.canvas.addMarker(this.dataObject.id, 'selected');
        return false;
      }
    }
    this.terminateStereotypeEditProcess();
  }

  // Show stereotype selector next to dataObject element on the model
  initDataObjectStereotypeSelector() {
    let overlayHtml = `
      <div class="panel panel-default stereotype-editor" id="` + this.dataObject.id + `-stereotype-selector">
        <div class="stereotype-editor-close-link" style="float: right; color: darkgray; cursor: pointer">X</div>
        <div class="stereotype-selector-main-menu">
          <div style="margin-bottom:10px;">
            <b>Stereotypes menu</b>
          </div>
          <table class="table table-hover stereotypes-table">
            <tbody>
              <tr>
                <td class="link-row" id="PKPublic-button">PKPublic</td>
              </tr>
              <tr>
              <td class="link-row" id="PKPrivate-button">PKPrivate</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    overlayHtml = $(overlayHtml);

    $(overlayHtml).on('click', '.stereotype-editor-close-link', (e) => {
      this.terminateDataObjectStereotypeSelector();
      this.beingEdited = false;
      this.stereotypeSelectorHidden = true;
    });

    // Stereotype links
    for (let stereotype of this.supportedStereotypes) {
      $(overlayHtml).on('click', '#' + stereotype + '-button', (e) => {
        this.addStereotypeByName(stereotype);
      });

      if (this.dataObject[(<any>stereotype)] != null) {
        $(overlayHtml).find('#' + stereotype + '-button').addClass('disabled-link');
      }
    }

    let stOverlay = this.overlays.add(this.registry.get(this.dataObject.id), {
      position: {
        bottom: 0,
        right: 0
      },
      show: {
        minZoom: 0,
        maxZoom: 5.0
      },
      html: overlayHtml
    });
    this.stereotypeSelector = stOverlay;
  }

  // Remove stereotype selector
  terminateDataObjectStereotypeSelector() {
    this.overlays.remove({ id: this.stereotypeSelector });
    this.stereotypeSelector = null;
  }

  // Create and return new stereotype instance by name
  createStereotypeByName(name: string) {
    let st = null;
    if (name) {
      if (name == "PKPublic") {
        st = new PKPublic(this);
      } else if (name == "PKPrivate") {
        st = new PKPrivate(this);
      }
    }
    return st;
  }

  // Add stereotype instance to the dataObject
  addStereotypeToDataObject(stereotype: DataObjectStereotype) {
    this.stereotypes.push(stereotype);
  }

  // Start adding new stereotype to the dataObject (open settings panel etc)
  addStereotypeByName(name: string) {
    if (this.tempStereotype == null) {
      let st = this.createStereotypeByName(name);
      st.isTempStereotype = true;
      st.loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight();
      this.tempStereotype = st;
    } else {
      if (this.tempStereotype.getTitle() != name) {
        this.tempStereotype.terminateStereotypeSettings();
        this.initElementStereotypeSettings();
        let st = this.createStereotypeByName(name);
        st.isTempStereotype = true;
        st.loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight();
        this.tempStereotype = st;
      }
    }
    this.initStereotypeSettingsPanel();
  }

  // Add new stereotype to the dataObject (save)
  addTempStereotypeToElement() {
    this.addStereotypeToDataObject(this.tempStereotype);
    this.addStereotypeLabelToElement(this.tempStereotype.getTitle());
  }

  // Remove stereotype from the dataObject by stereotype name
  removeStereotypeByName(name: string) {
    if (this.getDataObjectStereotypeInstanceByName(name)) {
      this.overlays.remove({ id: this.getDataObjectStereotypeInstanceByName(name).getLabel() });
      this.stereotypes = this.stereotypes.filter(obj => obj.getTitle() !== name);
      this.canvas.removeMarker(this.dataObject.id, 'selected');
      delete this.dataObject[(<any>name)];
    }
  }

  // Get stereotype instance of the dataObject by stereotype name
  getDataObjectStereotypeInstanceByName(name: string) {
    for (let sType of this.stereotypes) {
      if (sType.getTitle() == name) {
        return sType;
      }
    }
  }

  // Add stereotype label to the dataObject by stereotype name
  addStereotypeLabelToElement(title: string) {
    if (title != null) {
      let dataObjectTypeLabel = $(
        `<div class="stereotype-label" id="` + this.dataObject.id + `-` + title + `-label" style="padding:5px; border-radius:2px">
           <span class="stereotype-label-color" style="font-size:10px;"><b>` + title + `</b></span>
         </div>`
      );
      let topPosition, leftPosition = 0;
      if (is(this.dataObject, 'bpmn:DataStoreReference')) {
        topPosition = 20;
        leftPosition = -10;
      } else if (is(this.dataObject, 'bpmn:DataObjectReference')) {
        topPosition = 0;
        leftPosition = -10;
      }
      let stLabel = this.overlays.add(this.registry.get(this.dataObject.id), {
        position: {
          top: topPosition,
          left: leftPosition
        },
        show: {
          minZoom: 0,
          maxZoom: 5.0
        },
        html: dataObjectTypeLabel
      });
      this.getDataObjectStereotypeInstanceByName(title).setLabel(stLabel);
    }
  }

  // Return all task stereotype instances
  getAllDataObjectStereotypeInstances() {
    return this.stereotypes;
  }


  /** Wrappers to access elementsHandler functions*/

  getDataObjectHandlerByDataObjectId(dataObjectId: string) {
    return this.elementsHandler.getDataObjectHandlerByDataObjectId(dataObjectId);
  }

  getAllModelDataObjectHandlers() {
    return this.elementsHandler.getAllModelDataObjectHandlers();
  }

  updateModelContentVariable(xml: string) {
    this.elementsHandler.updateModelContentVariable(xml);
  }

  initStereotypeSettingsPanel() {
    this.elementsHandler.initStereotypeSettingsPanel(this);
  }

  terminateStereotypeSettingsPanel() {
    this.elementsHandler.terminateStereotypeSettingsPanel();
  }

}