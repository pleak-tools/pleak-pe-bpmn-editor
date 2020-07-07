import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { TaskHandler } from "./task-handler";
import { MessageFlowHandler } from "./message-flow-handler";
import { DataObjectHandler } from "./data-object-handler";
import { SimpleDisclosureAnalysisHandler } from "./simple-disclosure-analysis-handler";
import { ExtendedSimpleDisclosureAnalysisHandler } from "./extended-simple-disclosure-analysis-handler";
import { DataDependenciesAnalysisHandler } from './data-dependencies-analysis-handler';
import { LeakageDetectionComponent } from '../leakage-detection/leakage-detection.component';

declare let $: any;

export interface ValidationErrorObject {
  error: string;
  object: string[];
  highlight: string[];
}

export class ValidationHandler {

  constructor(viewer: Viewer, diagram: string, elementsHandler: ElementsHandler) {
    this.viewer = viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.eventBus = this.viewer.get('eventBus');
    this.canvas = this.viewer.get('canvas');
    this.diagram = diagram;
    this.elementsHandler = elementsHandler;
  }

  viewer: Viewer;
  registry: any;
  eventBus: any;
  canvas: any;
  diagram: string;

  analysisPanel: any;
  errorsList: any;
  errorsPanel: any;
  successPanel: any;

  elementsHandler: ElementsHandler;
  simpleDisclosureAnalysisHandler: SimpleDisclosureAnalysisHandler;
  extendedSimpleDisclosureAnalysisHandler: ExtendedSimpleDisclosureAnalysisHandler;
  dataDependenciesAnalysisHandler: DataDependenciesAnalysisHandler;

  taskHandlers: TaskHandler[] = [];
  messageFlowHandlers: MessageFlowHandler[] = [];
  dataObjectHandlers: DataObjectHandler[] = [];

  groupStereotypesOnModel: string[] = [];
  modelLanesAndPools: any[] = [];

  numberOfErrorsInModel: Number = 0;
  errorChecks: any = { dataObjects: false, tasks: false, messageFlows: false };

  init(): Promise<void> {
    return new Promise((resolve) => {
      // Add click event listener to init and terminate stereotype processes
      this.eventBus.on('element.click', (e) => {
        this.removeAllErrorHighlights();
        this.dataDependenciesAnalysisHandler.removeModelDependencyHiglights();
      });

      this.analysisPanel = $('#analysis');
      this.errorsList = $('#errors-list');
      this.errorsPanel = $('#model-errors');
      this.successPanel = $('#model-correct');

      this.initHandlers();
      resolve();
    });
  }

  initHandlers(): void {
    this.taskHandlers = this.elementsHandler.getAllModelTaskHandlers();
    this.messageFlowHandlers = this.elementsHandler.getAllModelMessageFlowHandlers();
    this.dataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    this.extendedSimpleDisclosureAnalysisHandler = new ExtendedSimpleDisclosureAnalysisHandler(this.viewer, this.elementsHandler, this);
    this.simpleDisclosureAnalysisHandler = new SimpleDisclosureAnalysisHandler(this.viewer, this.diagram, this.elementsHandler, this);
    this.dataDependenciesAnalysisHandler = new DataDependenciesAnalysisHandler(this.viewer, this.diagram, this.elementsHandler, this);
    this.extendedSimpleDisclosureAnalysisHandler.init(this.simpleDisclosureAnalysisHandler);

    LeakageDetectionComponent.initLeakageDetectionModal(this.analysisPanel);
  }

  // Add validation errors to the model validation errors list
  addUniqueErrorToErrorsList(errors: ValidationErrorObject[], error: string, ids: string[], highlight: string[]): void {
    let sameErrorMsgs = errors.filter(function (obj) {
      return obj.error == error && obj.object.toString() === ids.toString() && obj.highlight.toString() === highlight.toString();
    });
    if (sameErrorMsgs.length === 0) {
      errors.push({ error: error, object: ids, highlight: highlight });
    }
  }

  isAnalysisResultsPanelHidden(): boolean {
    return this.successPanel.hasClass('hidden') && this.errorsPanel.hasClass('hidden');
  }

  // Check for errors in task stereotypes
  checkForErrorsInStereotypes(stereotypes: any, existingErrors: ValidationErrorObject[]): void {
    for (let stereotype of stereotypes) {
      stereotype.checkForErrors(existingErrors);
    }
  }

  checkTaskErrors(errors: ValidationErrorObject[]): void {
    $('.analysis-spinner').fadeIn();
    if (this.taskHandlers.length > 0) {
      for (let i = 0; i < this.taskHandlers.length; i++) {
        let taskHandler = this.taskHandlers[i];
        this.checkForErrorsInStereotypes(taskHandler.getAllTaskStereotypeInstances(), errors);
        if (i == this.taskHandlers.length - 1) {
          this.errorChecks.tasks = true;
          this.checkDataObjectErrors(errors);
        }
      }
    } else {
      this.errorChecks.tasks = true;
      this.checkDataObjectErrors(errors);
    }
  }

  checkDataObjectErrors(errors: ValidationErrorObject[]): void {
    if (this.dataObjectHandlers.length > 0) {
      for (let k = 0; k < this.dataObjectHandlers.length; k++) {
        let dataObjectHandler = this.dataObjectHandlers[k];
        this.checkForErrorsInStereotypes(dataObjectHandler.getAllDataObjectStereotypeInstances(), errors);
        if (k == this.dataObjectHandlers.length - 1) {
          this.errorChecks.dataObjects = true;
          this.checkMessageFlowErrors(errors);
        }
      }
    } else {
      this.errorChecks.dataObjects = true;
      this.checkMessageFlowErrors(errors);
    }
  }

  checkMessageFlowErrors(errors: ValidationErrorObject[]): void {
    if (this.messageFlowHandlers.length > 0) {
      for (let j = 0; j < this.messageFlowHandlers.length; j++) {
        let messageFlowHandler = this.messageFlowHandlers[j];
        this.checkForErrorsInStereotypes(messageFlowHandler.getAllMessageFlowStereotypeInstances(), errors);
        if (j == this.messageFlowHandlers.length - 1) {
          this.errorChecks.messageFlows = true;
          this.showErrorsIfChecksFinished(errors);
        }
      }
    } else {
      this.errorChecks.messageFlows = true;
      this.showErrorsIfChecksFinished(errors);
    }
  }

  // Init validation checks for all stereotypes
  checkForStereotypeErrorsAndShowErrorsList(): void {
    if (this.areThereChangesInModel() || this.isAnalysisResultsPanelHidden()) {
      let errors: ValidationErrorObject[] = [];
      this.errorChecks = { dataObjects: false, tasks: false, messageFlows: false };
      this.checkTaskErrors(errors);
    } else {
      if (this.elementsHandler.isSQLLeaksWhenActive() && this.numberOfErrorsInModel > 0) {
        this.elementsHandler.parent.setPEBPMNMode();
      } else if (this.elementsHandler.isSQLLeaksWhenActive() && this.numberOfErrorsInModel === 0) {
        this.extendedSimpleDisclosureAnalysisHandler.showModal();
      }
    }
    this.elementsHandler.moveAnalysisResultsPanel();
  }

  showErrorsIfChecksFinished(errors: ValidationErrorObject[]): void {
    if (this.errorChecks.tasks && this.errorChecks.dataObjects && this.errorChecks.messageFlows) {
      this.createErrorsList(errors);
    }
  }

  // Create validation errors list
  createErrorsList(errors: ValidationErrorObject[]): void {
    let areThereAnyErrorsOnModel = false;
    let areThereAnyWarningsOnModel = false;
    // Empty previous errors list
    this.emptyErrorsList();
    // Create new errors list
    if (errors.length > 0) {
      this.numberOfErrorsInModel = errors.length;
      let errors_list = '<ol>';
      let i = 0;
      for (let error of errors) {
        if (error.error.indexOf("error") !== -1) {
          areThereAnyErrorsOnModel = true;
        }
        let color = "darkred";
        if (error.error.indexOf("warning") !== -1) {
          areThereAnyWarningsOnModel = true;
          color = "orange";
        }
        errors_list += '<li class="error-list-element error-' + i + '" style="font-size:16px; color:' + color + '; cursor:pointer;">' + error.error + '</li>';
        this.errorsList.on('click', '.error-' + i, (e) => {
          this.highlightObjectWithErrorByIds(error.object, error.highlight);
          $(e.target).css("font-weight", "bold");
        });
        i++;
      }
      errors_list += '</ol>';
      this.errorsList.html(errors_list);
      $('.analysis-spinner').hide();
      this.errorsPanel.removeClass('hidden');
      if (this.elementsHandler.isSQLLeaksWhenActive()) {
        this.elementsHandler.parent.setPEBPMNMode();
      }
    }
    if (areThereAnyErrorsOnModel) {
      this.analysisPanel.addClass('hidden');
    } else {
      $('.analysis-spinner').hide();
      if (!areThereAnyWarningsOnModel) {
        this.errorsList.html('');
        this.errorsPanel.addClass('hidden');
        if (this.elementsHandler.isSQLLeaksWhenActive()) {
          this.extendedSimpleDisclosureAnalysisHandler.showModal();
        } else {
          this.successPanel.removeClass('hidden');
        }
      }
      if (!this.elementsHandler.isSQLLeaksWhenActive()) {
        this.analysisPanel.removeClass('hidden');
      }
      this.simpleDisclosureAnalysisHandler.init();
      this.dataDependenciesAnalysisHandler.init();
    }
    this.setChangesInModelStatus(false);
  }

  emptyErrorsList(): void {
    this.errorsList.html('');
    this.successPanel.addClass('hidden');
    this.removeAllErrorHighlights();
    this.removeErrorsListClickHandlers();
    this.numberOfErrorsInModel = 0;
  }

  // Remove click handler of valiation error list links
  removeErrorsListClickHandlers(): void {
    for (let j = 0; j < this.numberOfErrorsInModel; j++) {
      this.errorsList.off('click', '.error-' + j);
    }
  }

  // Highlight objects with stereotype errors by ids
  highlightObjectWithErrorByIds(generalIds: string[], highlightIds: string[]): void {
    this.removeAllErrorHighlights();
    for (let id of generalIds) {
      this.canvas.addMarker(id, 'highlight-general-error');
    }
    for (let id of highlightIds) {
      this.canvas.addMarker(id, 'highlight-specific-error');
    }
  }

  // Remove validation error higlights of all stereotypes
  removeAllErrorHighlights(): void {
    for (let taskHandler of this.taskHandlers) {
      this.removeErrorHighlightsOfElement(taskHandler.getTaskId());
    }
    for (let messageFlowHandler of this.messageFlowHandlers) {
      this.removeErrorHighlightsOfElement(messageFlowHandler.getMessageFlowId());
    }
    for (let dataObjectHandler of this.dataObjectHandlers) {
      this.removeErrorHighlightsOfElement(dataObjectHandler.getDataObjectId());
    }
  }

  // Remove validation error higlights of tasks
  removeErrorHighlightsOfElement(elementId: string): void {
    $('.error-list-element').css("font-weight", "");
    $('.BPMNLeaksWhen-errors-list-element').css("font-weight", "");
    this.canvas.removeMarker(elementId, 'highlight-general-error');
    this.canvas.removeMarker(elementId, 'highlight-specific-error');
  }

  /** Validation functions */

  // Return unique objects from array by their id property
  getUniqueObjectsByIdFromArray(array: any[]): any[] {
    let uniqueObjects = [];
    for (let object of array) {
      let objectAlreadyInArray = uniqueObjects.filter((obj) => {
        return obj.id == object.id;
      });
      if (objectAlreadyInArray.length === 0) {
        uniqueObjects.push(object);
      }
    }
    return uniqueObjects;
  }

  // Return unique objects from array
  getUniqueObjectsFromArray(array: any[]): any[] {
    let uniqueObjects = [];
    for (let object of array) {
      let objectAlreadyInArray = uniqueObjects.filter((obj) => {
        return obj == object;
      });
      if (objectAlreadyInArray.length === 0) {
        uniqueObjects.push(object);
      }
    }
    return uniqueObjects;
  }

  // Return the list of lanes and pools
  getModelLanesAndPools(): any[] {
    return this.modelLanesAndPools;
  }

  // Add a lane or a pool to the list of lanes and pools
  addLaneOrPoolToTheListOfModelLanesAndPools(laneOrPoolId: string): void {
    let idAlreadyInList = this.modelLanesAndPools.filter((obj) => {
      return obj.id == laneOrPoolId;
    });
    if (idAlreadyInList.length === 0) {
      this.modelLanesAndPools.push({ id: laneOrPoolId, children: [] });
    }
  }

  // Connect tasks with lanes and pools
  loadTaskOntoParentLaneOrPool(parentId: string, taskId: string): void {
    let lanesAndPools = this.getModelLanesAndPools();
    for (let laneOrPool of lanesAndPools) {
      if (laneOrPool.id == parentId) {
        let tmp = laneOrPool.children;
        if (tmp.indexOf(taskId) === -1) {
          tmp.push(taskId);
        }
        laneOrPool.children = tmp;
      }
    }
  }

  // Return the list of stereotypes with groups
  getListOfModelGroupStereotypes(): string[] {
    return this.groupStereotypesOnModel;
  }

  // Add a stereotype to the list of stereotypes with groups
  addStereotypeToTheListOfGroupStereotypesOnModel(stereotype: string): void {
    if (this.groupStereotypesOnModel.indexOf(stereotype) === -1) {
      this.groupStereotypesOnModel.push(stereotype);
    }
  }

  // Check if task has a stereotype (by stereotype name)
  taskHasStereotype(task: any, stereotype: string): boolean {
    if (task && task[(<any>stereotype)]) {
      return true;
    } else {
      return false;
    }
  }

  // Get group name of a stereotype if task has one
  getGroupOfTaskStereotypeIfTaskHasOne(taskId: string): string | null {
    for (let stereotype of this.getListOfModelGroupStereotypes()) {
      let task = this.registry.get(taskId).businessObject;
      if (this.taskHasStereotype(task, stereotype)) {
        return (<any>this.elementsHandler.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName(stereotype)).getGroup();
      }
    }
    return null;
  }

  // Return list of tasks with group stereotypes divided between lanes and pools
  getLanesAndPoolsWithTasksWithGroupStereotypes(): any[] {
    let modelLanesAndPoolsWithTasks = this.getModelLanesAndPools();
    let lanesAndPoolsWithTasksWithGroupStereotypes = [];
    for (let laneOrPool of modelLanesAndPoolsWithTasks) {
      let children = [];
      let sorted = [];
      let groups = [];
      for (let child of laneOrPool.children) {
        for (let stereotype of this.getListOfModelGroupStereotypes()) {
          if (this.taskHasStereotype(this.registry.get(child).businessObject, stereotype)) {
            children.push(child);
          }
        }
      }
      sorted = children.sort((a, b) => {
        let aFirst = this.taskIsInIncomingPathOfTask(a, b);
        let bFirst = this.taskIsInIncomingPathOfTask(b, a);
        if (aFirst) return -1;
        if (bFirst) return 1;
        return 0;
      });
      for (let child of sorted) {
        let group = this.getGroupOfTaskStereotypeIfTaskHasOne(child);
        if (group) {
          groups.push(group);
        }
      }
      lanesAndPoolsWithTasksWithGroupStereotypes.push({ id: laneOrPool.id, children: sorted, groups: groups });
    }
    return lanesAndPoolsWithTasksWithGroupStereotypes;
  }

  // Return the list of tasks with stereotype groups that are not in the same order on all lanes and pools
  getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes(): string[] {
    let lanesAndPoolsWithTasksWithGroupStereotypes = this.getLanesAndPoolsWithTasksWithGroupStereotypes();
    let len = 999;
    let problematicTasks = [];
    for (let childrenGroup of lanesAndPoolsWithTasksWithGroupStereotypes) {
      if (childrenGroup.groups.length < len) {
        len = childrenGroup.groups.length;
      }
    }
    for (let childrenGroup of lanesAndPoolsWithTasksWithGroupStereotypes) {
      for (let childrenGroup2 of lanesAndPoolsWithTasksWithGroupStereotypes) {
        if (childrenGroup.id != childrenGroup2.id) {
          for (let i = 0; i < len; i++) {
            if (childrenGroup2.groups.indexOf(childrenGroup.groups[i]) !== -1 && childrenGroup.groups.indexOf(childrenGroup2.groups[i]) !== -1) {
              if (childrenGroup.groups[i] != childrenGroup2.groups[i]) {
                problematicTasks.push(childrenGroup.children[i]);
                problematicTasks.push(childrenGroup2.children[i]);
              }
            }
          }
        }
      }
    }
    return this.getUniqueValuesOfArray(problematicTasks);
  }

  // Check if the value is a number
  isInteger(value: any): boolean {
    value = Number(value);
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
  }

  // Check if businessObject.name values are the same for all objects in the array
  areNamesUnique(array: any[]): boolean {
    let tmpArr = [];
    for (let obj of array) {
      if (tmpArr.indexOf(obj.businessObject.name) < 0) {
        tmpArr.push(obj.businessObject.name);
      } else {
        return false;
      }
    }
    return true;
  }

  // Return number of occurences of the substring in the string
  occurrences(string: string, subString: string): number {
    string += "";
    subString += "";
    if (subString.length <= 0) {
      return (string.length + 1);
    }
    let n = 0;
    let pos = 0;
    let step = subString.length;
    while (true) {
      pos = string.indexOf(subString, pos);
      if (pos >= 0) {
        ++n;
        pos += step;
      } else {
        break;
      }
    }
    return n;
  }

  // Build tree paths from {key, parent} objects
  buildPaths(arr: any[], parent: any, c: any, result: any[]): any[] {
    return arr.reduce((r, e) => {
      if (e.parent == parent) {
        var children = this.buildPaths(arr, e.key, c + e.key + '->', result);
        if (!children.length) {
          result.push((c + e.key).split("->"));
        }
        r.push(e);
      }
      if (this.occurrences(c, parent) > 1) {
        arr = [];
      }
      return r;
    }, []);
  }

  // Check if specific element (by id) is one of the inputs of current task
  taskHasInputElement(taskId: string, elementId: string): boolean {
    let elements = this.elementsHandler.getTaskHandlerByTaskId(taskId).getTaskInputObjects().filter(function (obj) {
      return obj.id == elementId;
    });
    if (elements.length > 0) {
      return true;
    }
    return false;
  }

  // Check if specific element (by id) is one of the outputs of current task
  taskHasOutputElement(taskId: string, elementId: string): boolean {
    let elements = this.elementsHandler.getTaskHandlerByTaskId(taskId).getTaskOutputObjects().filter(function (obj) {
      return obj.id == elementId;
    });
    if (elements.length > 0) {
      return true;
    }
    return false;
  }

  // Check if specific task is in the incoming path of current task
  taskIsInIncomingPathOfTask(taskId: string, pathTaskId: string): boolean {
    let task = this.registry.get(pathTaskId).businessObject;
    if (this.getTasksOfIncomingPathByInputElement(task).indexOf(taskId) !== -1) {
      return true;
    }
    return false;
  }

  // Check if specific task is in the outgoing path of current task
  taskIsInOutgoingPathOfTask(taskId: string, pathTaskId: string): boolean {
    let task = this.registry.get(pathTaskId).businessObject;
    if (this.getTasksOfOutgoingPathByInputElement(task).indexOf(taskId) !== -1) {
      return true;
    }
    return false;
  }

  // Return true if at least one on inputObjects is an output of the task
  isOneOfInputObjectsInTaskStereotypeOutputs(taskId: string, inputObjects: any[]): boolean {
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        let outputElements = this.elementsHandler.getTaskHandlerByTaskId(task.id).getTaskOutputObjectsBasedOnTaskStereotype();
        if (outputElements && inputObjects) {
          let outputElementsNames = outputElements.filter((a) => {
            return a && a.businessObject && a.businessObject.name;
          }).map((a) => {
            return a.businessObject.name.trim();
          });
          let inputObjectsNames = inputObjects.filter((a) => {
            return a && a.businessObject && a.businessObject.name;
          }).map((a) => {
            return a.businessObject.name.trim();
          });
          for (let inputObjectName of inputObjectsNames) {
            if (outputElementsNames.indexOf(inputObjectName) !== -1) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // Find all tasks from the incoming path of task
  findIncomingPathTasks(incTasks: any[], input: any, sourceInputId: string, type: string, counts: any): void {
    if (!input) {
      return;
    }
    if (typeof input[Symbol.iterator] === 'function') {
      for (let element of input) {
        if (element.sourceRef) {
          this.findIncomingPathTasks(incTasks, element.sourceRef, sourceInputId, type, counts);
        } else if (element.incoming) {
          this.findIncomingPathTasks(incTasks, element.incoming, sourceInputId, type, counts);
        }
      }
      return;
    }

    // Stop recursion if too many loops
    counts[input.id] = counts[input.id] ? counts[input.id] + 1 : 1;
    if (counts[input.id] >= 10 || incTasks.filter(item => item == input.id).length >= 10) {
      return;
    }
    if (input.id != sourceInputId) {
      if (input.$type === "bpmn:Task") {
        incTasks.push(input.id);
        if (type === "first") {
          return;
        }
      }
      if (input.$type === "bpmn:StartEvent" || input.$type === "bpmn:IntermediateCatchEvent") {
        let rElements;
        if (input.$parent.$parent.rootElements) {
          rElements = input.$parent.$parent.rootElements;
        } else if (input.$parent.$parent.$parent.rootElements) {
          rElements = input.$parent.$parent.$parent.rootElements;
        }
        for (let el of rElements) {
          if (el.$type === "bpmn:Collaboration") {
            if (el.messageFlows) {
              for (let mF of el.messageFlows) {
                if (mF.targetRef.id == input.id) {
                  this.findIncomingPathTasks(incTasks, mF.sourceRef, sourceInputId, type, counts);
                }
              }
            }
          }
        }
      }

      if (input.sourceRef) {
        this.findIncomingPathTasks(incTasks, input.sourceRef, sourceInputId, type, counts);
      }
      if (input.incoming) {
        this.findIncomingPathTasks(incTasks, input.incoming, sourceInputId, type, counts);
      }
    }
  }

  // Find all tasks from the outgoing path of task
  findOutgoingPathTasks(incTasks: any[], input: any, sourceInputId: string, type: string): void {
    if (!input) {
      return;
    }
    if (incTasks.filter(item => item == input.id).length > 10) {
      return;
    }
    if (input.id != sourceInputId) {
      if (input.$type === "bpmn:Task") {
        incTasks.push(input.id);
        if (type === "first") {
          return;
        }
      }
      if (input.targetRef) {
        this.findOutgoingPathTasks(incTasks, input.targetRef, sourceInputId, type);
      }
      if (input.outgoing) {
        this.findOutgoingPathTasks(incTasks, input.outgoing, sourceInputId, type);
      }
      if (input.$type === "bpmn:StartEvent" || input.$type === "bpmn:IntermediateCatchEvent") {
        let rElements;
        if (input.$parent.$parent.rootElements) {
          rElements = input.$parent.$parent.rootElements;
        } else if (input.$parent.$parent.$parent.rootElements) {
          rElements = input.$parent.$parent.$parent.rootElements;
        }
        for (let el of rElements) {
          if (el.$type === "bpmn:Collaboration") {
            if (el.messageFlows) {
              for (let mF of el.messageFlows) {
                if (mF.sourceRef.id == input.id) {
                  this.findOutgoingPathTasks(incTasks, mF.targetRef, sourceInputId, type);
                }
              }
            }
          }
        }
      }
      if (typeof input[Symbol.iterator] === 'function') {
        for (let element of input) {
          if (element.targetRef) {
            this.findOutgoingPathTasks(incTasks, element.targetRef, sourceInputId, type);
          } else if (element.outgoing) {
            this.findOutgoingPathTasks(incTasks, element.outgoing, sourceInputId, type);
          }
        }
      }
    }
  }

  // Find all exclusive gateways from the incoming path of task
  findIncomingPathExclusiveGateways(incGateways: any[], input: any): void {
    if (!incGateways) {
      return;
    }
    if (incGateways.filter(item => item == input.id).length > 10) {
      return;
    }
    if (input.$type === "bpmn:ExclusiveGateway") {
      incGateways.push(input.id);
    }
    if (input.sourceRef) {
      this.findIncomingPathExclusiveGateways(incGateways, input.sourceRef);
    }
    if (input.incoming) {
      this.findIncomingPathExclusiveGateways(incGateways, input.incoming);
    }
    if (input.$type === "bpmn:StartEvent" || input.$type === "bpmn:IntermediateCatchEvent") {
      let rElements;
      if (input.$parent.$parent.rootElements) {
        rElements = input.$parent.$parent.rootElements;
      } else if (input.$parent.$parent.$parent.rootElements) {
        rElements = input.$parent.$parent.$parent.rootElements;
      }
      for (let el of rElements) {
        if (el.$type === "bpmn:Collaboration") {
          if (el.messageFlows) {
            for (let mF of el.messageFlows) {
              if (mF.targetRef.id == input.id) {
                this.findIncomingPathExclusiveGateways(incGateways, mF.sourceRef);
              }
            }
          }
        }
      }
    }
    if (typeof input[Symbol.iterator] === 'function') {
      for (let element of input) {
        if (element.sourceRef) {
          this.findIncomingPathExclusiveGateways(incGateways, element.sourceRef);
        } else if (element.incoming) {
          this.findIncomingPathExclusiveGateways(incGateways, element.incoming);
        }
      }
    }
  }

  // Find all StartEvent and IntermediateEvent elements from the incoming path of task
  findIncomingPathStartAndIntermediateEvents(incEvents: any[], input: any, sourceInputId: string, incTasks: any): void {
    if (!incEvents) {
      return;
    }
    if (!input || typeof (input) === "undefined") {
      return;
    }
    if (input.$type === "bpmn:Task") {
      incTasks.push(input.id);
    }
    if (incTasks.filter(item => item.id == input.id).length > 10) {
      return;
    }
    if (incEvents.filter(item => item.id == input.id).length > 10) {
      return;
    }
    if (input.id != sourceInputId) {
      if (input.sourceRef) {
        this.findIncomingPathStartAndIntermediateEvents(incEvents, input.sourceRef, sourceInputId, incTasks);
      }
      if (input.incoming) {
        this.findIncomingPathStartAndIntermediateEvents(incEvents, input.incoming, sourceInputId, incTasks);
      }
      if (input.$type === "bpmn:StartEvent" || input.$type === "bpmn:IntermediateCatchEvent") {
        incEvents.push(input);
        let rElements;
        if (input.$parent.$parent.rootElements) {
          rElements = input.$parent.$parent.rootElements;
        } else if (input.$parent.$parent.$parent.rootElements) {
          rElements = input.$parent.$parent.$parent.rootElements;
        }
        for (let el of rElements) {
          if (el.$type === "bpmn:Collaboration") {
            if (el.messageFlows) {
              for (let mF of el.messageFlows) {
                if (mF.targetRef.id == input.id) {
                  this.findIncomingPathStartAndIntermediateEvents(incEvents, mF.sourceRef, sourceInputId, incTasks);
                }
              }
            }
          }
        }
      }
      if (typeof input[Symbol.iterator] === 'function') {
        for (let element of input) {
          if (element.sourceRef) {
            this.findIncomingPathStartAndIntermediateEvents(incEvents, element.sourceRef, sourceInputId, incTasks);
          } else if (element.incoming) {
            this.findIncomingPathStartAndIntermediateEvents(incEvents, element.incoming, sourceInputId, incTasks);
          }
        }
      }
    }
  }

  // Return all tasks from the incoming path of task
  getTasksOfIncomingPathByInputElement(inputElement: any): string[] {
    let incTasks = [];
    let counts = {};
    this.findIncomingPathTasks(incTasks, inputElement.incoming, inputElement.id, null, counts);
    let rElements;
    if (inputElement.$parent.$parent.rootElements) {
      rElements = inputElement.$parent.$parent.rootElements;
    } else if (inputElement.$parent.$parent.$parent.rootElements) {
      rElements = inputElement.$parent.$parent.$parent.rootElements;
    }
    for (let el of rElements) {
      if (el.$type === "bpmn:Collaboration") {
        if (el.messageFlows) {
          for (let mF of el.messageFlows) {
            if (mF.targetRef.$type === "bpmn:Task" && incTasks.indexOf(mF.targetRef.id) !== -1 || mF.targetRef.id == inputElement.id) {
              this.findIncomingPathTasks(incTasks, mF.sourceRef, inputElement.id, null, counts);
            }
          }
        }
      }
    }
    return this.getUniqueValuesOfArray(incTasks);
  }

  // Return all tasks from the outgoing path of task
  getTasksOfOutgoingPathByInputElement(inputElement: any): string[] {
    let outgTasks = [];
    this.findOutgoingPathTasks(outgTasks, inputElement.outgoing, inputElement.id, null);
    let rElements;
    if (inputElement.$parent.$parent.rootElements) {
      rElements = inputElement.$parent.$parent.rootElements;
    } else if (inputElement.$parent.$parent.$parent.rootElements) {
      rElements = inputElement.$parent.$parent.$parent.rootElements;
    }
    for (let el of rElements) {
      if (el.$type === "bpmn:Collaboration") {
        if (el.messageFlows) {
          for (let mF of el.messageFlows) {
            if (mF.sourceRef.$type === "bpmn:Task" && (this.taskIsInIncomingPathOfTask(inputElement.id, mF.sourceRef.id) || outgTasks.indexOf(mF.sourceRef.id) !== -1) || mF.sourceRef.id == inputElement.id) {
              this.findOutgoingPathTasks(outgTasks, mF.targetRef, inputElement.id, null);
            }
          }
        }
      }
    }
    return this.getUniqueValuesOfArray(outgTasks);
  }

  // Return all (first) tasks from the incoming path of element
  getFirstTasksOfIncomingPathOfInputElement(input: any): string[] {
    let incTasks = [];
    let counts = {};
    this.findIncomingPathTasks(incTasks, input.incoming, input.id, "first", counts);
    let rElements;
    if (input.$parent.$parent.rootElements) {
      rElements = input.$parent.$parent.rootElements;
    } else if (input.$parent.$parent.$parent.rootElements) {
      rElements = input.$parent.$parent.$parent.rootElements;
    }
    for (let el of rElements) {
      if (el.$type === "bpmn:Collaboration") {
        if (el.messageFlows) {
          for (let mF of el.messageFlows) {
            if (mF.targetRef.$type === "bpmn:Task" && incTasks.indexOf(mF.targetRef.id) !== -1 || mF.targetRef.id == input.id) {
              this.findIncomingPathTasks(incTasks, mF.sourceRef, input.id, "first", counts);
            }
          }
        }
      }
    }
    return this.getUniqueValuesOfArray(incTasks);
  }

  // Return all (first) tasks from the outgoing path of element
  getFirstTasksOfOutgoingPathOfStartEventElements(input: any): string[] {
    let outgTasks = [];
    this.findOutgoingPathTasks(outgTasks, input.outgoing, input.id, "first");
    let rElements;
    if (input.$parent.$parent.rootElements) {
      rElements = input.$parent.$parent.rootElements;
    } else if (input.$parent.$parent.$parent.rootElements) {
      rElements = input.$parent.$parent.$parent.rootElements;
    }
    for (let el of rElements) {
      if (el.$type === "bpmn:Collaboration") {
        if (el.messageFlows) {
          for (let mF of el.messageFlows) {
            if (mF.sourceRef.$type === "bpmn:Task" && (this.taskIsInIncomingPathOfTask(input.id, mF.sourceRef.id) || outgTasks.indexOf(mF.sourceRef.id) !== -1) || mF.sourceRef.id == input.id) {
              this.findOutgoingPathTasks(outgTasks, mF.targetRef, input.id, "first");
            }
          }
        }
      }
    }
    return this.getUniqueValuesOfArray(outgTasks);
  }

  // Return all exclusive gateways from the incoming path of element
  getExclusiveGatewaysOfIncomingPathOfInputElement(input: any): string[] {
    let incTasks = [];
    this.findIncomingPathExclusiveGateways(incTasks, input.incoming);
    let rElements;
    if (input.$parent.$parent.rootElements) {
      rElements = input.$parent.$parent.rootElements;
    } else if (input.$parent.$parent.$parent.rootElements) {
      rElements = input.$parent.$parent.$parent.rootElements;
    }
    for (let el of rElements) {
      if (el.$type === "bpmn:Collaboration") {
        if (el.messageFlows) {
          for (let mF of el.messageFlows) {
            if (mF.targetRef.$type === "bpmn:Task" && incTasks.indexOf(mF.targetRef.id) !== -1 || mF.targetRef.id == input.id) {
              this.findIncomingPathExclusiveGateways(incTasks, mF.sourceRef);
            }
          }
        }
      }
    }
    return this.getUniqueValuesOfArray(incTasks);
  }

  // Return all StartEvent and IntermediateEvent elements from the incoming path of task
  getIncomingPathStartAndIntermediateEvents(task: any): string[] {
    let events = [];
    let tasks = []
    if (task) {
      this.findIncomingPathStartAndIntermediateEvents(events, task.incoming, task.id, tasks);
    }
    return this.getUniqueValuesOfArray(events);
  }

  // Return all paths from the process of current task
  getAllPathsOfProcess(taskId: string): any[] {
    let allPathsOfProcess = [];
    let processTask = this.registry.get(taskId).businessObject;
    let startEventElementsOfCurrentTaskProcess = this.getIncomingPathStartAndIntermediateEvents(processTask);
    for (let j = 0; j < startEventElementsOfCurrentTaskProcess.length; j++) {
      let relations = [];
      let uniqueRelations = [];
      let paths = [];

      for (let task of this.getUniqueValuesOfArray(this.getTasksOfOutgoingPathByInputElement(startEventElementsOfCurrentTaskProcess[j]))) {
        for (let firstIncomingTask of this.getFirstTasksOfIncomingPathOfInputElement(this.registry.get(task).businessObject)) {
          relations.push({ key: task, parent: firstIncomingTask });
        }
      }

      for (let firstOutgoingTask of this.getFirstTasksOfOutgoingPathOfStartEventElements(startEventElementsOfCurrentTaskProcess[j])) {
        relations.push({ key: firstOutgoingTask, parent: 'none' });
      }

      for (let relation of relations) {
        let relationAlreadyInRelations = uniqueRelations.filter((obj) => {
          return obj.key == relation.key && obj.parent == relation.parent;
        });
        if (relationAlreadyInRelations.length === 0) {
          uniqueRelations.push(relation);
        }
      }

      this.buildPaths(uniqueRelations, 'none', '', paths);
      allPathsOfProcess.push(paths);
    }
    return allPathsOfProcess;
  }

  // Check if tasks (by id) are parallel
  areTasksParallel(taskIds: string[]): boolean {
    for (let taskId of taskIds) {
      for (let taskId2 of taskIds) {
        if (taskId !== taskId2) {
          if (this.taskIsInIncomingPathOfTask(taskId2, taskId) || this.taskIsInOutgoingPathOfTask(taskId2, taskId)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Check if tasks with group stereotypes are in the same order on all lanes and pools
  areGroupsTasksInSameOrderOnAllPoolsAndLanes(): boolean {
    let problematicGroupsTasks = this.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
    if (problematicGroupsTasks.length > 0) {
      return false;
    }
    return true;
  }

  // Check if current task is in all paths that have exclusive gateways between their tasks
  areAllGroupTasksAccesibleForTask(taskId: string): boolean {
    for (let paths of this.getAllPathsOfProcess(taskId)) {
      for (let path1 of paths) {
        for (let path2 of paths) {
          let commonTasksInPaths = path1.filter(value => -1 !== path2.indexOf(value));
          if (path1.toString() !== path2.toString() && (path1[0] !== path2[0] && path1[0] !== taskId && path2[0] !== taskId || commonTasksInPaths.length === 0)) {
            let len = path1.length;
            if (path2.length < len) {
              len = path2.length;
            }
            for (let i = 0; i < len; i++) {
              if (path1[i] != path2[i]) {
                let gateways1 = this.getExclusiveGatewaysOfIncomingPathOfInputElement(this.registry.get(path2[i]).businessObject);
                let gateways2 = this.getExclusiveGatewaysOfIncomingPathOfInputElement(this.registry.get(path1[i]).businessObject);
                let commonGatewaysInPaths = $.grep(gateways1, (element) => {
                  return $.inArray(element, gateways2) !== -1;
                });
                if (commonGatewaysInPaths.length > 0) {
                  let subPath1 = path1.slice(i, path1.length);
                  let subPath2 = path2.slice(i, path2.length);
                  if (subPath1.indexOf(taskId) === -1 && subPath2.indexOf(taskId) !== -1 || subPath1.indexOf(taskId) !== -1 && subPath2.indexOf(taskId) === -1) {
                    let gW1 = this.getExclusiveGatewaysOfIncomingPathOfInputElement(this.registry.get(path1[0]).businessObject);
                    let gW2 = this.getExclusiveGatewaysOfIncomingPathOfInputElement(this.registry.get(path2[0]).businessObject)
                    if (gW1.length > 0 && gW2.length > 0 && gW1.toString() === gW2.toString()) {
                      let commonTasksInSubPaths = subPath1.filter(value => -1 !== subPath2.indexOf(value));
                      if (commonTasksInSubPaths.length === 0) {
                        return false;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return true;
  }

  isThereAtLeastOneStartEventInCurrentTaskProcess(task: any): boolean {
    let events = this.getIncomingPathStartAndIntermediateEvents(task);
    if (task && events.length > 0) {
      return true;
    }
    return false;
  }

  // Get unique values of an array
  getUniqueValuesOfArray(array: string[]): string[] {
    return array.filter((v, i, a) => a.indexOf(v) === i);
  }

  /* */
  setChangesInModelStatus(status: boolean): void {
    this.elementsHandler.setModelChanged(status);
  }

  areThereChangesInModel(): boolean {
    return this.elementsHandler.getModelChanged();
  }

}