import * as Rx from 'rxjs/Rx';
import { Subject } from "rxjs/Subject";
import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { TaskHandler } from "./task-handler";
import { MessageFlowHandler } from "./message-flow-handler";
import { DataObjectHandler } from "./data-object-handler";
import { ValidationHandler } from './validation-handler';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class ElementsHandler {

  constructor(viewer: Viewer, diagram: String, parent: any, parentType: String) {
    this.viewer = viewer;
    this.eventBus = this.viewer.get('eventBus');
    this.canvas = this.viewer.get('canvas');
    this.diagram = diagram;
    this.parent = parent;
    this.parentType = parentType;
    this.init();
  }

  viewer: Viewer;
  eventBus: any;
  canvas: any;
  diagram: String;
  parent: any;
  parentType: String;

  validationHandler: ValidationHandler;

  taskHandlers: TaskHandler[] = [];
  messageFlowHandlers: MessageFlowHandler[] = [];
  dataObjectHandlers: DataObjectHandler[] = [];

  init() {
    this.validationHandler = new ValidationHandler(this.viewer, this.diagram, this);
    // Import model from xml file
    this.viewer.importXML(this.diagram, () => {
      this.viewer.get("moddle").fromXML(this.diagram, (err:any, definitions:any) => {
        if (typeof definitions !== 'undefined') {
          // Add stereotype labels to elements based on xml labels
          this.viewer.importDefinitions(definitions, () => this.createElementHandlerInstances(definitions));
          $('#analyze-diagram').addClass('active');
        }
      });
      // Add click event listener to init and terminate stereotype processes
      this.eventBus.on('element.click', (e) => {
        // If there is some other element being edited than clicked one, terminate edit process
        let beingEditedElementHandler = this.taskHandlers.filter(function( obj ) {
          return obj.task != e.element.businessObject && (obj.beingEdited && obj.stereotypeSelector != null || obj.stereotypeSelectorHidden);
        });
        if (beingEditedElementHandler.length > 0) {
          beingEditedElementHandler[0].terminateStereotypeEditProcess();
        }
        let beingEditedMessageFlowHandler = this.messageFlowHandlers.filter(function( obj ) {
          return obj.messageFlow != e.element.businessObject && obj.beingEdited && obj.stereotypeSelector != null;
        });
        if (beingEditedMessageFlowHandler.length > 0) {
          beingEditedMessageFlowHandler[0].terminateStereotypeEditProcess();
        }
        let beingEditedDataObjectHandler = this.dataObjectHandlers.filter(function( obj ) {
          return obj.dataObject != e.element.businessObject && (obj.beingEdited && obj.stereotypeSelector != null || obj.stereotypeSelectorHidden);
        });
        if (beingEditedDataObjectHandler.length > 0) {
          beingEditedDataObjectHandler[0].terminateStereotypeEditProcess();
        }
        
        // If clicked element is not yet being edited, start edit process
        let toBeEditedelementHandler = [];
        if (is(e.element.businessObject, 'bpmn:Task')) {
          toBeEditedelementHandler = this.taskHandlers.filter(function( obj ) {
            return obj.task == e.element.businessObject && obj.beingEdited == false;
          });
        } else if (is(e.element.businessObject, 'bpmn:MessageFlow')) {
          toBeEditedelementHandler = this.messageFlowHandlers.filter(function( obj ) {
            return obj.messageFlow == e.element.businessObject && obj.beingEdited == false;
          });
        } else if (is(e.element.businessObject, 'bpmn:DataObjectReference')) {
          toBeEditedelementHandler = this.dataObjectHandlers.filter(function( obj ) {
            return obj.dataObject == e.element.businessObject && obj.beingEdited == false;
          });
        }
        if (toBeEditedelementHandler.length > 0) {
          if (this.parentType === "public" && is(e.element.businessObject, 'bpmn:Task')) {
            toBeEditedelementHandler[0].initPublicStereotypeView();
          } else if (this.parentType === "public" && is(e.element.businessObject, 'bpmn:DataObjectReference')) {
            toBeEditedelementHandler[0].initPublicStereotypeView();
          } else if (this.parentType === "public" && is(e.element.businessObject, 'bpmn:MessageFlow')) {
            // Currently do nothing
          } else {
            toBeEditedelementHandler[0].initStereotypeEditProcess();
          }
        }

      });
    });
  }

  // Create handler instance for each task / messageFlow of model
  createElementHandlerInstances(definitions: any) {
    for (let diagram of definitions.diagrams) {
      let element = diagram.plane.bpmnElement;
      if (element.$type === "bpmn:Process") {
        if (element.flowElements) {
          for (let node of element.flowElements.filter((e:any) => is(e, "bpmn:Task"))) {
            this.taskHandlers.push(new TaskHandler(this, node));
          }
          for (let node of element.flowElements.filter((e:any) => is(e, "bpmn:DataObjectReference"))) {
            this.dataObjectHandlers.push(new DataObjectHandler(this, node));
          }
        }
      } else {
        for (let participant of element.participants) {
          if (participant.processRef.flowElements) {
            for (let node of participant.processRef.flowElements.filter((e:any) => is(e, "bpmn:Task"))) {
              this.taskHandlers.push(new TaskHandler(this, node));
            }
            for (let sprocess of participant.processRef.flowElements.filter((e:any) => is(e, "bpmn:SubProcess"))) {
              for (let node of sprocess.flowElements.filter((e:any) => is(e, "bpmn:Task"))) {
                this.taskHandlers.push(new TaskHandler(this, node));
              }
            }
            for (let node of participant.processRef.flowElements.filter((e:any) => is(e, "bpmn:DataObjectReference"))) {
              this.dataObjectHandlers.push(new DataObjectHandler(this, node));
            }
          }
        }
      }
      if (element.$type === "bpmn:Collaboration") {
        if (element.messageFlows) {
          for (let node of element.messageFlows.filter((e:any) => is(e, "bpmn:MessageFlow"))) {
            this.messageFlowHandlers.push(new MessageFlowHandler(this, node));
          }
        }
      }
    }
  }

  updateModelContentVariable(xml: String) {
    this.parent.updateModelContentVariable(xml);
    this.validationHandler.hideSimpleDisclosureAnalysisMenuOnModelChange();
  }

  // Get taskHandler instance of task by task id
  getTaskHandlerByTaskId(taskId: String) {
    let taskHandler = null;
    let taskHandlerWithTaskId = this.getAllModelTaskHandlers().filter(function( obj ) {
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

  // Get messageFlowHandler instance of messageFlow by messageFlow id
  getMessageFlowHandlerByMessageFlowId(messageFlowId: String) {
    let messageFlowHandler = null;
    let messageFlowHandlerWithMessageFlowId = this.getAllModelMessageFlowHandlers().filter(function( obj ) {
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
  getDataObjectHandlerByDataObjectId(dataObjectId: String) {
    let dataObjectHandler = null;
    let dataObjectHandlerWithMessageFlowId = this.getAllModelDataObjectHandlers().filter(function( obj ) {
      return obj.dataObject.id == dataObjectId;
    });
    if (dataObjectHandlerWithMessageFlowId.length > 0) {
      dataObjectHandler = dataObjectHandlerWithMessageFlowId[0];
    }
    return dataObjectHandler;
  }

  // Get all dataObjectHandler instances of the model
  getAllModelDataObjectHandlers() {
    return this.dataObjectHandlers;
  }

  initValidation() {
    if (this.parent.getChangesInModelStatus()) {
      this.checkForStereotypeErrorsAndShowErrorsList();
    }
  }


  /** Wrappers to access validationHandler functions*/

  checkForStereotypeErrorsAndShowErrorsList() {
    this.validationHandler.checkForStereotypeErrorsAndShowErrorsList();
  }

}