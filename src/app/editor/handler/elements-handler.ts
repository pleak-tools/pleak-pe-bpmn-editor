import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { TaskHandler } from "./task-handler";
import { MessageFlowHandler } from "./message-flow-handler";
import { DataObjectHandler } from "./data-object-handler";
import { ValidationHandler } from './validation-handler';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class ElementsHandler {

  constructor(viewer: Viewer, diagram: string, parent: any, canEdit: Boolean) {
    this.viewer = viewer;
    this.lastContent = diagram;
    this.eventBus = this.viewer.get('eventBus');
    this.canvas = this.viewer.get('canvas');
    this.overlays = this.viewer.get('overlays');
    this.diagram = diagram;
    this.parent = parent;
    this.canEdit = canEdit;
  }

  viewer: Viewer;
  eventBus: any;
  canvas: any;
  diagram: string;
  overlays: any;
  parent: any;
  canEdit: Boolean;

  private changesInModel: boolean = true;

  validationHandler: ValidationHandler;

  taskHandlers: TaskHandler[] = [];
  messageFlowHandlers: MessageFlowHandler[] = [];
  dataObjectHandlers: DataObjectHandler[] = [];

  private lastContent: string | null;
  private content: string | null;

  selectedElement: any = null;
  selectedDataObjects: any[] = [];

  selectedDataObjectSettings: any = null;

  public SelectedTarget: any = {
    name: null,
    r: null,
    c: null,
  };

  modelLoaded: boolean = false;

  isPEBPMModeActive(): boolean {
    return this.parent.activeMode === "PEBPMN";
  }

  isSQLLeaksWhenActive(): boolean {
    return this.parent.activeMode === "SQLleaks";
  }

  init() {
    return new Promise((resolve) => {
      this.validationHandler = new ValidationHandler(this.viewer, this.diagram, this);
      // Import model from xml file
      this.viewer.importXML(this.diagram, () => {
        this.canvas.zoom('fit-viewport', 'auto');
        this.viewer.get("moddle").fromXML(this.diagram, (err: any, definitions: any) => {
          if (typeof definitions !== 'undefined') {
            // Add stereotype labels to elements based on xml labels
            this.viewer.importDefinitions(definitions, () => {
              this.createElementHandlerInstances(definitions).then(() => {
                this.prepareTaskAndDataObjectHandlersForAnalysis().then(() => {
                  this.validationHandler.init().then(() => {
                    $('#stereotype-options').html('');
                    this.parent.initExportButton();
                    this.modelLoaded = true;
                    resolve();
                  });
                })
              });
            });
          }
        });

        // Add click event listener to init and terminate stereotype processes
        this.eventBus.on('element.click', (e) => {

          console.log(e.element)
          this.selectedElement = e.element;

          // Selecting dataObjects and dataStores for SQL leaks-when analysis
          if (this.isSQLLeaksWhenActive()) {
            this.initDataObjectSelectMenu(e.element);
          }

          if (is(e.element.businessObject, 'bpmn:Task') || is(e.element.businessObject, 'bpmn:DataObjectReference') || is(e.element.businessObject, 'bpmn:DataStoreReference') || is(e.element.businessObject, 'bpmn:MessageFlow')) {

            this.canvas.removeMarker(e.element.id, 'selected');
            // If there is some other element being edited than clicked one, terminate edit process
            let beingEditedTasktHandler = this.taskHandlers.filter(function (obj) {
              return obj.task != e.element.businessObject && (obj.beingEdited && obj.stereotypeSelector != null || obj.stereotypeSelectorHidden);
            });
            if (beingEditedTasktHandler.length > 0) {
              beingEditedTasktHandler[0].checkForUnsavedChanges();
            }
            let beingEditedMessageFlowHandler = this.messageFlowHandlers.filter(function (obj) {
              return obj.messageFlow != e.element.businessObject && (obj.beingEdited && obj.stereotypeSelector != null || obj.stereotypeSelectorHidden);
            });
            if (beingEditedMessageFlowHandler.length > 0) {
              beingEditedMessageFlowHandler[0].checkForUnsavedChanges();
            }
            let beingEditedDataObjectHandler = this.dataObjectHandlers.filter(function (obj) {
              return obj.dataObject != e.element.businessObject && (obj.beingEdited && obj.stereotypeSelector != null || obj.stereotypeSelectorHidden);
            });
            if (beingEditedDataObjectHandler.length > 0) {
              beingEditedDataObjectHandler[0].checkForUnsavedChanges();
            }

          }

          // If clicked element is not yet being edited, start edit process
          let toBeEditedelementHandler = [];

          if (!this.isAnotherTaskOrDataObjectBeingEdited(e.element.id)) {

            this.canvas.addMarker(e.element.id, 'selected');
            if (is(e.element.businessObject, 'bpmn:Task')) {
              toBeEditedelementHandler = this.taskHandlers.filter(function (obj) {
                return obj.task == e.element.businessObject && obj.beingEdited == false;
              });
            } else if (is(e.element.businessObject, 'bpmn:MessageFlow')) {
              toBeEditedelementHandler = this.messageFlowHandlers.filter(function (obj) {
                return obj.messageFlow == e.element.businessObject && obj.beingEdited == false;
              });
            } else if (is(e.element.businessObject, 'bpmn:DataObjectReference') || is(e.element.businessObject, 'bpmn:DataStoreReference')) {
              toBeEditedelementHandler = this.dataObjectHandlers.filter(function (obj) {
                return obj.dataObject == e.element.businessObject && obj.beingEdited == false;
              });
            }
            if (toBeEditedelementHandler.length > 0) {
              if (!this.isPEBPMModeActive() || !this.canEdit && (is(e.element.businessObject, 'bpmn:Task') || is(e.element.businessObject, 'bpmn:DataObjectReference') || is(e.element.businessObject, 'bpmn:DataStoreReference') || is(e.element.businessObject, 'bpmn:MessageFlow'))) {
                toBeEditedelementHandler[0].initPublicStereotypeView();
              } else {
                toBeEditedelementHandler[0].initStereotypeEditProcess();
              }
            }

          }

        });
      });
    });
  }

  initDataObjectSelectMenu(element: any): void {
    this.terminateDataObjectSelectMenu();
    if ((element.type === "bpmn:DataObjectReference" || element.type === "bpmn:DataStoreReference") && element.incoming && element.incoming.length > 0) {
      this.reloadDataObjectSelectMenu(element);
    }

  }

  reloadDataObjectSelectMenu(element: any): void {
    this.terminateDataObjectSelectMenu();
    const dataObjectId = element.businessObject.id;

    let overlayHtml = `<div class="dataObject-selector-editor" id="` + dataObjectId + `-dataObject-selector" style="background:white; padding:10px; border-radius:2px">`;

    if ((element.type === "bpmn:DataObjectReference" || element.type === "bpmn:DataStoreReference") && element.incoming && element.incoming.length > 0) {
      const index = this.selectedDataObjects.findIndex(x => x === element.businessObject);
      if (index === -1) {
        overlayHtml += `<button class="btn btn-default" id="` + dataObjectId + `-dataObject-on-button">Select</button><br>`;
      } else {
        overlayHtml += `<button class="btn btn-default" id="` + dataObjectId + `-dataObject-off-button">Deselect</button><br>`;
      }
    }
    overlayHtml += `</div>`;
    overlayHtml = $(overlayHtml);

    this.selectedDataObjectSettings = this.overlays.add(element, {
      position: {
        top: -15,
        right: -30
      },
      html: overlayHtml
    });

    if ((element.type === "bpmn:DataObjectReference" || element.type === "bpmn:DataStoreReference") && element.incoming && element.incoming.length > 0) {
      const index = this.selectedDataObjects.findIndex(x => x === element.businessObject);
      if (index === -1) {
        $(overlayHtml).on('click', '#' + dataObjectId + '-dataObject-on-button', (ev1) => {
          this.selectedDataObjects.push(element.businessObject);
          this.canvas.addMarker(element.id, 'highlight-input-selected');
          this.reloadDataObjectSelectMenu(element);
        });
      } else {
        $(overlayHtml).on('click', '#' + dataObjectId + '-dataObject-off-button', (ev2) => {
          this.selectedDataObjects.splice(index, 1);
          this.canvas.removeMarker(element.id, 'highlight-input-selected');
          this.reloadDataObjectSelectMenu(element);
        });
      }
    }
  }

  terminateDataObjectSelectMenu(): void {
    if (this.selectedDataObjectSettings != null) {
      this.overlays.remove({ id: this.selectedDataObjectSettings });
      this.selectedDataObjectSettings = null;
    }
  }

  initWithoutClickHandlers() {
    this.validationHandler = new ValidationHandler(this.viewer, this.diagram, this);
    // Import model from xml file
    this.viewer.importXML(this.diagram, () => {
      this.viewer.get("moddle").fromXML(this.diagram, (err: any, definitions: any) => {
        if (typeof definitions !== 'undefined') {
          this.canvas.zoom('fit-viewport', 'auto');
          // Add stereotype labels to elements based on xml labels
          this.viewer.importDefinitions(definitions, () => {
            this.createElementHandlerInstances(definitions).then(() => {
              this.validationHandler.initHandlers();
            });
          });
        }
      });
    });
  }

  prepareTaskAndDataObjectHandlersForAnalysis(): Promise<void> {
    return new Promise((handlersPrepared) => {
      for (const taskHandler of this.taskHandlers) {
        taskHandler.prepareAnalysisDetails();
      }
      for (const dataObjectHandler of this.dataObjectHandlers) {
        dataObjectHandler.prepareAnalysisDetails();
      }
      handlersPrepared();
    });
  }

  // Check if another element (compared to the input id) is being currently edited
  isAnotherTaskOrDataObjectBeingEdited(elementId: string) {
    let beingEditedElementHandler = this.taskHandlers.filter(function (obj) {
      return obj.beingEdited;
    });
    let beingEditedDataObjectHandler = this.dataObjectHandlers.filter(function (obj) {
      return obj.beingEdited;
    });
    let beingEditedMessageFlowHandler = this.messageFlowHandlers.filter(function (obj) {
      return obj.beingEdited;
    });
    if ((beingEditedElementHandler.length > 0 && beingEditedElementHandler[0].task.id !== elementId) || (beingEditedDataObjectHandler.length > 0 && beingEditedDataObjectHandler[0].dataObject.id !== elementId) || (beingEditedMessageFlowHandler.length > 0 && beingEditedMessageFlowHandler[0].messageFlow.id !== elementId)) {
      return true;
    }
    return false;
  }

  initStereotypeSettingsPanel(elementHandler: any) {
    if (elementHandler.stereotypes.length > 0 || elementHandler.tempStereotype != null) {
      $(document).find('#stereotype-options-title').text(elementHandler.getName());
      $(document).find('#stereotype-options-hide-button').off('click');
      $(document).find('#stereotype-options-hide-button').on('click', () => {
        elementHandler.checkForUnsavedChanges();
      });
      if (this.canEdit) {
        $(document).find('#stereotype-options-save-button').removeClass('hidden');
        $(document).find('#stereotype-options-save-button').off('click');
        $(document).find('#stereotype-options-save-button').on('click', () => {
          this.saveStereotypes(elementHandler);
        });
      }
      $(document).find('#stereotype-options-sidebar').removeClass('hidden');
      this.moveStereotypeSettingsPanel();
    }
  }

  terminateStereotypeSettingsPanel() {
    $(document).find('#stereotype-options-title').text('');
    $(document).find('#stereotype-options-hide-button').off('click');
    $(document).find('#stereotype-options-sidebar').addClass('hidden');
  }

  moveAnalysisResultsPanel(): void {
    let PEBPMNanalysisPanel = $('#PEBPMN-analysis-sidebar');
    PEBPMNanalysisPanel.detach();
    $('#sidebar-panels').prepend(PEBPMNanalysisPanel);
    $('#sidebar').scrollTop(0);
  }

  moveStereotypeSettingsPanel(): void {
    let stereotypeSettingsPanel = $('#stereotype-options-sidebar');
    stereotypeSettingsPanel.detach();
    $('#sidebar-panels').prepend(stereotypeSettingsPanel);
    $('#sidebar').scrollTop(0);
  }

  saveStereotypes(elementHandler: any) {
    let flag = false;
    if (elementHandler.tempStereotype != null && !elementHandler.tempStereotype.saveStereotypeSettings()) {
      flag = true;
    }
    for (let sType of elementHandler.stereotypes) {
      if (!sType.saveStereotypeSettings()) {
        flag = true;
      }
    }
    if (!flag) {
      elementHandler.terminateStereotypeEditProcess();
      this.viewer.saveXML(
        {
          format: true
        },
        (err: any, xml: string) => {
          this.updateModelContentVariable(xml);
        }
      );
    }
  }

  // Create handler instance for each task / messageFlow of model
  createElementHandlerInstances(definitions: any) {
    return new Promise((resolve) => {
      for (let diagram of definitions.diagrams) {
        let element = diagram.plane.bpmnElement;
        if (element.$type === "bpmn:Process") {
          if (element.flowElements) {
            for (let node of element.flowElements.filter((e: any) => is(e, "bpmn:Task"))) {
              this.taskHandlers.push(new TaskHandler(this, node));
            }
            for (let node of element.flowElements.filter((e: any) => is(e, "bpmn:DataObjectReference"))) {
              this.dataObjectHandlers.push(new DataObjectHandler(this, node));
            }
            for (let node of element.flowElements.filter((e: any) => is(e, "bpmn:DataStoreReference"))) {
              this.dataObjectHandlers.push(new DataObjectHandler(this, node));
            }
          }
        } else {
          for (let participant of element.participants) {
            if (participant.processRef && participant.processRef.flowElements) {
              for (let node of participant.processRef.flowElements.filter((e: any) => is(e, "bpmn:Task"))) {
                this.taskHandlers.push(new TaskHandler(this, node));
              }
              for (let sprocess of participant.processRef.flowElements.filter((e: any) => is(e, "bpmn:SubProcess"))) {
                if (sprocess.flowElements) {
                  for (let node of sprocess.flowElements.filter((e: any) => is(e, "bpmn:Task"))) {
                    this.taskHandlers.push(new TaskHandler(this, node));
                  }
                  for (let node of sprocess.flowElements.filter((e: any) => is(e, "bpmn:DataObjectReference"))) {
                    this.dataObjectHandlers.push(new DataObjectHandler(this, node));
                  }
                }
              }
              for (let node of participant.processRef.flowElements.filter((e: any) => is(e, "bpmn:DataObjectReference"))) {
                this.dataObjectHandlers.push(new DataObjectHandler(this, node));
              }
              for (let node of participant.processRef.flowElements.filter((e: any) => is(e, "bpmn:DataStoreReference"))) {
                this.dataObjectHandlers.push(new DataObjectHandler(this, node));
              }
            }
          }
        }
        if (element.$type === "bpmn:Collaboration") {
          if (element.messageFlows) {
            for (let node of element.messageFlows.filter((e: any) => is(e, "bpmn:MessageFlow"))) {
              this.messageFlowHandlers.push(new MessageFlowHandler(this, node));
            }
          }
        }
      }
      resolve();
    });
  }

  updateModelContentVariable(xml: string) {
    if (xml) {
      this.parent.editorService.updateModel(xml);
      this.content = xml;
      if (this.content != this.lastContent) {
        this.setModelChanged(true);
        this.validationHandler.simpleDisclosureAnalysisHandler.terminate();
        this.validationHandler.dataDependenciesAnalysisHandler.terminate();
      }
    }
  }

  // Get taskHandler instance of task by task id
  getTaskHandlerByTaskId(taskId: string) {
    let taskHandler = null;
    let taskHandlerWithTaskId = this.getAllModelTaskHandlers().filter(function (obj) {
      return obj.task.id == taskId;
    });
    if (taskHandlerWithTaskId.length > 0) {
      taskHandler = taskHandlerWithTaskId[0];
    }
    return taskHandler;
  }

  // Get all taskHandler instances of the model
  getAllModelTaskHandlers() {
    return this.taskHandlers;
  }

  terminateElementsEditing() {
    this.selectedElement = null;
    this.validationHandler.removeAllErrorHighlights();
    for (let taskHandler of this.getAllModelTaskHandlers()) {
      taskHandler.terminateStereotypeEditProcess();
    }
    for (let dataObjectHandler of this.getAllModelDataObjectHandlers()) {
      dataObjectHandler.terminateStereotypeEditProcess();
    }
    for (let messageFlow of this.getAllModelMessageFlowHandlers()) {
      messageFlow.terminateStereotypeEditProcess();
    }
  }

  // Get messageFlowHandler instance of messageFlow by messageFlow id
  getMessageFlowHandlerByMessageFlowId(messageFlowId: string) {
    let messageFlowHandler = null;
    let messageFlowHandlerWithMessageFlowId = this.getAllModelMessageFlowHandlers().filter(function (obj) {
      return obj.messageFlow.id == messageFlowId;
    });
    if (messageFlowHandlerWithMessageFlowId.length > 0) {
      messageFlowHandler = messageFlowHandlerWithMessageFlowId[0];
    }
    return messageFlowHandler;
  }

  // Get all messageFlowHandler instances of the model
  getAllModelMessageFlowHandlers() {
    return this.messageFlowHandlers;
  }

  // Get dataObjectHandler instance of dataObject by dataObject id
  getDataObjectHandlerByDataObjectId(dataObjectId: string) {
    let dataObjectHandler = null;
    if (dataObjectId) {
      let dataObjectHandlerWithMessageFlowId = this.getAllModelDataObjectHandlers().filter(function (obj) {
        return obj && obj.dataObject && obj.dataObject.id && obj.dataObject.id == dataObjectId;
      });
      if (dataObjectHandlerWithMessageFlowId.length > 0) {
        dataObjectHandler = dataObjectHandlerWithMessageFlowId[0];
      }
    }
    return dataObjectHandler;
  }

  // Get all dataObjectHandler instances of the model
  getAllModelDataObjectHandlers() {
    return this.dataObjectHandlers;
  }

  getDataObjectHandlersByDataObjectName(name: string) {
    let handlers = [];
    let tmp = this.getAllModelDataObjectHandlers().filter((obj) => {
      return obj.dataObject.name.trim() == name.trim();
    });
    if (tmp.length > 0) {
      handlers = tmp;
    }
    return handlers;
  }

  initValidation() {
    this.checkForStereotypeErrorsAndShowErrorsList();
  }

  areThereUnsavedChangesOnModel() {
    let beingEditedElementHandler = this.taskHandlers.filter(function (obj) {
      return obj.beingEdited;
    });
    let beingEditedDataObjectHandler = this.dataObjectHandlers.filter(function (obj) {
      return obj.beingEdited;
    });
    let beingEditedMessageFlowHandler = this.messageFlowHandlers.filter(function (obj) {
      return obj.beingEdited;
    });
    if (beingEditedElementHandler.length > 0) {
      if (beingEditedElementHandler[0].areThereUnsavedTaskChanges()) {
        return true;
      }

    }
    if (beingEditedDataObjectHandler.length > 0) {
      if (beingEditedDataObjectHandler[0].areThereUnsavedDataObjectChanges()) {
        return true;
      }
    }
    if (beingEditedMessageFlowHandler.length > 0) {
      if (beingEditedMessageFlowHandler[0].areThereUnsavedMessageFlowChanges()) {
        return true;
      }
    }
  }

  setModelChanged(status: boolean) {
    this.changesInModel = status;
  }

  getModelChanged() {
    return this.changesInModel;
  }

  /** Wrappers to access validationHandler functions*/

  checkForStereotypeErrorsAndShowErrorsList() {
    this.validationHandler.checkForStereotypeErrorsAndShowErrorsList();
  }

}