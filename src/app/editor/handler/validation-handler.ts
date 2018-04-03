import * as Rx from 'rxjs/Rx';
import { Subject } from "rxjs/Subject";
import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { TaskHandler } from "./task-handler";
import { MessageFlowHandler } from "./message-flow-handler";
import { DataObjectHandler } from "./data-object-handler";
import { error } from 'util';
import { element } from 'protractor';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export interface ValidationErrorObject {
  error: String;
  object: String[];
  highlight: String[];
}

export class ValidationHandler {

  constructor(viewer: Viewer, diagram: String, elementsHandler: ElementsHandler) {
    this.viewer = viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.eventBus = this.viewer.get('eventBus');
    this.canvas = this.viewer.get('canvas');
    this.diagram = diagram;
    this.elementsHandler = elementsHandler;
    this.init();
  }

  viewer: Viewer;
  registry: any;
  eventBus: any;
  canvas: any;
  diagram: String;

  elementsHandler: ElementsHandler;

  taskHandlers: TaskHandler[] = [];
  messageFlowHandlers: MessageFlowHandler[] = [];
  dataObjectHandlers: DataObjectHandler[] = [];

  groupStereotypesOnModel: String[] = [];
  modelLanesAndPools: any[] = [];

  numberOfErrorsInModel: Number = 0;
  errorChecks: any = {dataObjects: false, tasks: false, messageFlows: false};

  init() {
    // Import model from xml file
    this.viewer.importXML(this.diagram, () => {
      // Add click event listener to init and terminate stereotype processes
      this.eventBus.on('element.click', (e) => {
        this.removeAllErrorHighlights();
      });
    });
    this.taskHandlers = this.elementsHandler.getAllModelTaskHandlers();
    this.messageFlowHandlers = this.elementsHandler.getAllModelMessageFlowHandlers();
    this.dataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
  }

  // Add validation errors to the model validation errors list
  addUniqueErrorToErrorsList(errors: ValidationErrorObject[], error: String, ids: String[], highlight: String[]) {
    let sameErrorMsgs = errors.filter(function( obj ) {
      return obj.error == error && obj.object.toString() === ids.toString() && obj.highlight.toString() === highlight.toString();
    });
    if (sameErrorMsgs.length === 0) {
      errors.push({error: error, object: ids, highlight: highlight});
    }
  }

  // Check for errors in task stereotypes
  checkForErrorsInStereotypes(stereotypes: any, existingErrors: ValidationErrorObject[]) {
    for (let stereotype of stereotypes) {
      let errorsInStereotype = stereotype.checkForErrors(existingErrors);
    }
  }

  checkTaskErrors(errors) {
    $('.analysis-spinner').fadeIn();
    for (let i = 0; i < this.taskHandlers.length; i++) {
      let taskHandler = this.taskHandlers[i];
      this.checkForErrorsInStereotypes(taskHandler.getAllTaskStereotypeInstances(), errors);
      if (i == this.taskHandlers.length-1) {
        this.errorChecks.tasks = true;
        this.checkDataObjectErrors(errors);
      }
    }
  }

  checkDataObjectErrors(errors) {
    for (let k = 0; k < this.dataObjectHandlers.length; k++) {
      let dataObjectHandler = this.dataObjectHandlers[k];
      this.checkForErrorsInStereotypes(dataObjectHandler.getAllDataObjectStereotypeInstances(), errors);
      if (k == this.dataObjectHandlers.length-1) {
        this.errorChecks.dataObjects = true;
        this.checkMessageFlowErrors(errors);
      }
    }
  }

  checkMessageFlowErrors(errors) {
    for (let j = 0; j < this.messageFlowHandlers.length; j++) {
      let messageFlowHandler = this.messageFlowHandlers[j];
      this.checkForErrorsInStereotypes(messageFlowHandler.getAllMessageFlowStereotypeInstances(), errors);
      if (j == this.messageFlowHandlers.length-1) {
        this.errorChecks.messageFlows = true;
        this.showErrorsIfChecksFinished(errors);
      }
    }
  }

  // Init validation checks for all stereotypes
  checkForStereotypeErrorsAndShowErrorsList() {
    let errors: ValidationErrorObject[] = [];
    this.errorChecks = {dataObjects: false, tasks: false, messageFlows: false};
    this.checkTaskErrors(errors);
  }

  showErrorsIfChecksFinished(errors) {
    if (this.errorChecks.tasks && this.errorChecks.dataObjects && this.errorChecks.messageFlows) {
      this.createErrorsList(errors);
    }
  }

  // Create validation errors list
  createErrorsList(errors: ValidationErrorObject[]) {
    let areThereAnyErrorsOnModel = false;
    // Empty previous errors list
    $('#errors-list').html('');
    $('#model-correct').hide();
    this.removeAllErrorHighlights();
    this.removeErrorsListClickHandlers();
    this.numberOfErrorsInModel = 0;
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
          color = "orange";
        }
        errors_list += '<li class="error-list-element error-'+i+'" style="font-size:16px; color:' + color + '; cursor:pointer;">'+error.error+'</li>';
        $('#errors-list').on('click', '.error-' + i, (e) => {
          this.highlightObjectWithErrorByIds(error.object, error.highlight);
          $(e.target).css("font-weight", "bold");
        });
        i++;
      }
      errors_list += '</ol>';
      $('#errors-list').html(errors_list);
      $('.analysis-spinner').hide();
      $('#model-errors').show();
    }
    if (areThereAnyErrorsOnModel) {
      $('#analysis').hide();
      $('#analysis').off('click', '#analyze-simple-disclosure');
      $('#analysis').off('click', '#analyze-dependencies');
      this.setChangesInModelStatus(false);
    } else {
      $('.analysis-spinner').hide();
      $('#errors-list').html('');
      $('#model-errors').hide();
      $('#model-correct').show();
      $('#analysis').show();
      $('#analysis').off('click', '#analyze-simple-disclosure');
      $('#analysis').off('click', '#analyze-dependencies');
      $('#analysis').on('click', '#analyze-simple-disclosure', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.createSimpleDisclosureReportTable();
      });
      $('#analysis').on('click', '#analyze-dependencies', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.createDataDependenciesAnalysisReportTable();
      });
      this.setChangesInModelStatus(false);
    }
  }

  // Hide simple disclosure menu (button) on model change, as the analysis report might have been changed
  hideSimpleDisclosureAnalysisMenuOnModelChange() {
    $('#model-correct').hide();
    $('#analysis').hide();
  }

  // Remove click handler of valiation error list links
  removeErrorsListClickHandlers() {
    for (let j=0; j < this.numberOfErrorsInModel; j++) {
      $('#errors-list').off('click', '.error-' + j);
    }
  }

  // Highlight objects with stereotype errors by ids
  highlightObjectWithErrorByIds(generalIds: String[], highlightIds: String[]) {
    this.removeAllErrorHighlights();
    for (let id of generalIds) {
      this.canvas.addMarker(id, 'highlight-general-error');
    }
    for (let id of highlightIds) {
      this.canvas.addMarker(id, 'highlight-specific-error');
    }
  }

  // Remove validation error higlights of all stereotypes
  removeAllErrorHighlights() {
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
  removeErrorHighlightsOfElement(elementId: String) {
    $('.error-list-element').css("font-weight", "");
    this.canvas.removeMarker(elementId, 'highlight-general-error');
    this.canvas.removeMarker(elementId, 'highlight-specific-error');
  }

  // Compare object name properties
  compareNames(a: any, b: any) {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }

  // Check if task has a stereotype (by stereotype name)
  messageFlowHasStereotype(messageFlow: any, stereotype: String) {
    if (messageFlow && messageFlow[(<any>stereotype)]) {
      return true;
    } else {
      return false;
    }
  }

  // Return list of lanes and pools with their names
  getListOfModelLanesAndPoolsObjects() {
    let lanesAndPools = this.getModelLanesAndPools();
    let lanesAndPoolsObjects = [];
    for (let laneOrPool of lanesAndPools) {
      if (this.registry.get(laneOrPool.id).businessObject.name) {
        lanesAndPoolsObjects.push({id: laneOrPool.id, name: this.registry.get(laneOrPool.id).businessObject.name.trim(), children: laneOrPool.children});
      }
    }
    lanesAndPoolsObjects = lanesAndPoolsObjects.sort(this.compareNames);
    return lanesAndPoolsObjects;
  }

  // Return list of data objects (unique by their name)
  getListOfModelUniqueDataObjects() {
    let dataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    let uniqueDataObjectsByName = [];
    for (let dataObjectHandler of dataObjectHandlers) {
      let visibleTo = $.unique(dataObjectHandler.getLanesAndPoolsDataObjectIsVisibleTo());
      let visibility = dataObjectHandler.getVisibilityStatus();
      if (dataObjectHandler.dataObject.name) {
        let dataObjectAlreadyAdded = uniqueDataObjectsByName.filter(( obj ) => {
          return obj.name.trim() == dataObjectHandler.dataObject.name.trim();
        });
        if (dataObjectAlreadyAdded.length > 0) {
          dataObjectAlreadyAdded[0].visibleTo = $.unique(dataObjectAlreadyAdded[0].visibleTo.concat(visibleTo));
          dataObjectAlreadyAdded[0].visibility = $.unique(dataObjectAlreadyAdded[0].visibility.concat(visibility));
        } else {
          uniqueDataObjectsByName.push({name: dataObjectHandler.dataObject.name.trim(), visibleTo: visibleTo, visibility: visibility});
        }
      }
    }
    uniqueDataObjectsByName = uniqueDataObjectsByName.sort(this.compareNames);
    return uniqueDataObjectsByName;
  }

  // Return list of dataObjects that are moved over MessageFlow / SecureChannel
  getListOfModeldataObjectsAndMessageFlowConnections() {
    let messageFlowHandlers = this.elementsHandler.getAllModelMessageFlowHandlers();
    let messageFlowObjects = [];
    for (let messageFlowHandler of messageFlowHandlers) {
      let messageFlowOutputNames = messageFlowHandler.getMessageFlowOutputObjects().map(a => a.businessObject.name.trim());
      let connectedDataObjects = messageFlowOutputNames;
      let messageFlow = messageFlowHandler.messageFlow;
      let messageFlowType = "MF";
      if (this.messageFlowHasStereotype(messageFlow, "SecureChannel") || this.messageFlowHasStereotype(messageFlow, "CommunicationProtection")) {
        messageFlowType = "S";
      }
      for (let dObject of connectedDataObjects) {
        let oTypes = [];
        oTypes.push(messageFlowType);
        let messageFlowAlreadyInList = messageFlowObjects.filter(( obj ) => {
          return obj.dataObject == dObject;
        });
        if (messageFlowAlreadyInList.length === 0) {
          messageFlowObjects.push({dataObject: dObject, types: oTypes});
        } else {
          messageFlowAlreadyInList[0].types = $.unique(messageFlowAlreadyInList[0].types.concat(oTypes));
        }
      }
    }
    return messageFlowObjects;
  }

  // Return unique objects from array by their id property
  getUniqueObjectsByIdFromArray(array: any[]) {
    let uniqueObjects = [];
    for (let object of array) {
      let objectAlreadyInArray = uniqueObjects.filter(( obj ) => {
        return obj.id == object.id;
      });
      if (objectAlreadyInArray.length === 0) {
        uniqueObjects.push(object);
      }
    }
    return uniqueObjects;
  }

  // Return unique objects from array
  getUniqueObjectsFromArray(array: any[]) {
    let uniqueObjects = [];
    for (let object of array) {
      let objectAlreadyInArray = uniqueObjects.filter(( obj ) => {
        return obj == object;
      });
      if (objectAlreadyInArray.length === 0) {
        uniqueObjects.push(object);
      }
    }
    return uniqueObjects;
  }

  // Return information about data objects that are related to each other
  getDataObjectsDependencies() {
    let dependencies = [];
    let allDataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    for (let dataObjectHandler of allDataObjectHandlers) {
      for (let parentTask of dataObjectHandler.getDataObjectIncomingParentTasks()) {
        let parentOutputs = this.elementsHandler.getTaskHandlerByTaskId(parentTask.id).getTaskOutputObjects();
        for (let dO of parentOutputs) {
          let dataObjectAlreadyInList = dependencies.filter(( obj ) => {
            return obj.name === dO.businessObject.name.trim();
          });
          if (dataObjectAlreadyInList.length !== 0) {
            //if (this.getDataObjectsOfIncomingPathByInputElement(dO).length > 0) {
              dataObjectAlreadyInList[0].connections = $.unique(dataObjectAlreadyInList[0].connections.concat(this.getDataObjectsOfIncomingPathByInputElement(dO).map(a=>a.businessObject.name.trim())));
            //}
          } else {
            //if (this.getDataObjectsOfIncomingPathByInputElement(dO).length > 0 && dO.businessObject.name) {
            if (dO.businessObject.name) {
              dependencies.push({name: dO.businessObject.name.trim(), connections: $.unique(this.getDataObjectsOfIncomingPathByInputElement(dO).map(a=>a.businessObject.name.trim()))});
            }
          }
        }
      }
    }
    dependencies = dependencies.sort(this.compareNames);
    return dependencies;
  }

  // Return list of unique (by name) data objects on the model
  getListOfModelUniqueDataObjectNames() {
    let dataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    let uniqueDataObjectsByName = [];
    for (let dataObjectHandler of dataObjectHandlers) {
      if (dataObjectHandler.dataObject.name) {
        if (uniqueDataObjectsByName.indexOf(dataObjectHandler.dataObject.name.trim()) === -1) {
          uniqueDataObjectsByName.push(dataObjectHandler.dataObject.name.trim());
        }
      }
    }
    return uniqueDataObjectsByName.sort();
  }

  getOutgoingDataObjectInstancesByName(dataObjectName: String) {
    let allDataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    let dataObjects = [];
    for (let dataObjectHandler of allDataObjectHandlers) {
      for (let parentTask of dataObjectHandler.getDataObjectIncomingParentTasks()) {
        let parentOutputs = this.elementsHandler.getTaskHandlerByTaskId(parentTask.id).getTaskOutputObjects();
        for (let dO of parentOutputs) {
          if (dO.businessObject.name) {
            let dOName = dO.businessObject.name.trim();
            if (dOName == dataObjectName) {
              dataObjects.push(dO);
            }
          }
        }
      }
    }
    return dataObjects;
  }

  getIncomingDataObjectInstancesByName(dataObjectName: String) {
    let allDataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    let dataObjects = [];
    for (let dataObjectHandler of allDataObjectHandlers) {
      for (let parentTask of dataObjectHandler.getDataObjectOutgoingParentTasks()) {
        let parentOutputs = this.elementsHandler.getTaskHandlerByTaskId(parentTask.id).getTaskInputObjects();
        for (let dO of parentOutputs) {
          if (dO.businessObject.name) {
            let dOName = dO.businessObject.name.trim();
            if (dOName == dataObjectName) {
              dataObjects.push(dO);
            }
          }
        }
      }
    }
    return dataObjects;
  }

  // Check if two data objects (by name) have at least one same parent (by name)
  isThereACommonParentForDataObjects(dataObject1Name: String, dataObject2Name: String) {
    let dataObject1Instances = this.getOutgoingDataObjectInstancesByName(dataObject1Name);
    let dataObject2Instances = this.getIncomingDataObjectInstancesByName(dataObject2Name);
    let dO1Parents = [];
    let dO2Parents = [];
    for (let dO1Instance of dataObject1Instances) {
      let dO1InstanceParents = this.elementsHandler.getDataObjectHandlerByDataObjectId(dO1Instance.id).getDataObjectIncomingParentTasks();
      dO1Parents = dO1Parents.concat(dO1InstanceParents);
    }
    for (let dO2Instance of dataObject2Instances) {
      let dO2InstanceParents = this.elementsHandler.getDataObjectHandlerByDataObjectId(dO2Instance.id).getDataObjectOutgoingParentTasks();
      dO2Parents = dO2Parents.concat(dO2InstanceParents);
    }
    for (let parent1 of dO1Parents) {
      for (let parent2 of dO2Parents) {
        let p1 = this.registry.get(parent1.id).businessObject.name.trim();
        let p2 = this.registry.get(parent2.id).businessObject.name.trim();
        if (p1 == p2) {
          return true;
        }
      }
    }
    return false;
  }

  // Create data dependencies report table
  createDataDependenciesAnalysisReportTable() {
    let uniqueDataObjectNames = this.getListOfModelUniqueDataObjectNames();
    let dependencies = this.getDataObjectsDependencies();
    let rows = uniqueDataObjectNames.length;
    let columns = uniqueDataObjectNames.length;

    let table = "";
    table += '<table class="table" style="text-align:center">';
    table += '<tr><th style="background-color:#f5f5f5; text-align:center;">#</th>';
    for (let c = 0; c < columns; c++) {
      table += '<th style="background-color:#f5f5f5; text-align:center;">' + uniqueDataObjectNames[c] + '</th>';
    }
    table += '</tr>';
    for (let r = 0; r < rows; r++) {
      table += '<tr><td style="background-color:#f5f5f5;"><b>' + uniqueDataObjectNames[r] + '</b></td>';
      for (let c = 0; c < columns; c++) {
        let value = '-';
        if (uniqueDataObjectNames[r] != uniqueDataObjectNames[c]) {
          let hasRelations = dependencies.filter(( obj ) => {
            return obj.name === uniqueDataObjectNames[r];
          });
          if (hasRelations.length !== 0) {
            if (hasRelations[0].connections.indexOf(uniqueDataObjectNames[c]) !== -1) {
              if (this.isThereACommonParentForDataObjects(uniqueDataObjectNames[r], uniqueDataObjectNames[c])) {
                value = 'D';
              } else {
                value = 'I';
              }
            }
          }
        }
        if (uniqueDataObjectNames[r] == uniqueDataObjectNames[c] && value == '-') {
          value = '#';
        }
        table += '<td>'+value+'</td>';
      }
      table += '</tr>';
    }
    table += '</tabel>';
    $('#dataDependenciesAnalysisReportModal').find('#report-table').html('');
    $('#dataDependenciesAnalysisReportModal').find('#report-table').html(table);
    $('#dataDependenciesAnalysisReportModal').find('#dependenciesAnalysisReportTitle').text('');
    $('#dataDependenciesAnalysisReportModal').find('#dependenciesAnalysisReportTitle').text(this.elementsHandler.parent.file.title);
    $('#dataDependenciesAnalysisReportModal').modal();
  }

  // Create simple disclosure report table
  createSimpleDisclosureReportTable() {
    let uniqueLanesAndPools = this.getListOfModelLanesAndPoolsObjects();
    let uniqueDataObjectsByName = this.getListOfModelUniqueDataObjects();
    let dataObjectMessageFlowConnections = this.getListOfModeldataObjectsAndMessageFlowConnections();
    let rows = uniqueLanesAndPools.length;
    let columns = uniqueDataObjectsByName.length;

    let table = "";
    table += '<table class="table" style="text-align:center">';
    table += '<tr><th style="background-color:#f5f5f5; text-align:center;">#</th>';
    for (let c = 0; c < columns; c++) {
      table += '<th style="background-color:#f5f5f5; text-align:center;">' + uniqueDataObjectsByName[c].name + '</th>';
    }
    table += '</tr>';
    for (let r = 0; r < rows; r++) {
      table += '<tr><td style="background-color:#f5f5f5;"><b>' + uniqueLanesAndPools[r].name + '</b></td>';
      for (let c = 0; c < columns; c++) {
        if (uniqueDataObjectsByName[c].visibleTo.indexOf(uniqueLanesAndPools[r].id) !== -1) {
          let visibility = "";
          let visibilityDataOriginal = $.unique(uniqueDataObjectsByName[c].visibility);
          let visibilityData = [];
          for (let vData of visibilityDataOriginal) {
            visibilityData.push(vData.split("-")[0]);
          }
          visibilityData = $.unique(visibilityData);
          if (visibilityData.length === 1) {
            if (visibilityData[0] == "private") {
              visibility = "H";
            } else if (visibilityData[0] == "public") {
              visibility = "V";
            }
          } else if (visibilityData.length > 1) {
            visibility = "V";
            for (let data of visibilityDataOriginal) {
              let source = data.split('-')[1];
              if (source == "o") {
                if (data.split('-')[0] == "private") {
                  visibility = "H";
                } else if (data.split('-')[0] == "public") {
                  visibility = "V";
                }
              }
            }
          } else if (visibilityData.length === 0) {
            visibility = "V";
          }
          table += '<td>' + visibility + '</td>';
        } else {
          table += '<td>-</td>';
        }
        
      }
      table += '</tr>';
    }

    if (dataObjectMessageFlowConnections) {
      table += '<tr><td colspan="' + (columns+1) + '"></td></tr><tr><td>Shared over</td>'
      for (let c2 = 0; c2 < columns; c2++) {
        let messageFlowAlreadyInList = dataObjectMessageFlowConnections.filter(( obj ) => {
          return obj.dataObject == uniqueDataObjectsByName[c2].name;
        });
        if (messageFlowAlreadyInList.length !== 0) {
          table += '<td>' + messageFlowAlreadyInList[0].types + '</td>';
        } else {
          table += '<td>-</td>';
        }
      }
      table += '</tr>';
    }
    table += '</tabel>';
    $('#simpleDisclosureReportModal').find('#report-table').html('');
    $('#simpleDisclosureReportModal').find('#report-table').html(table);
    $('#simpleDisclosureReportModal').find('#simpleDisclosureReportTitle').text('');
    $('#simpleDisclosureReportModal').find('#simpleDisclosureReportTitle').text(this.elementsHandler.parent.file.title);
    $('#simpleDisclosureReportModal').modal();
  }

  /** Validation functions */

  // Return the list of lanes and pools
  getModelLanesAndPools() {
    return this.modelLanesAndPools;
  }

  // Add a lane or a pool to the list of lanes and pools
  addLaneOrPoolToTheListOfModelLanesAndPools(laneOrPoolId: String) {
    let idAlreadyInList = this.modelLanesAndPools.filter(( obj ) => {
      return obj.id == laneOrPoolId;
    });
    if (idAlreadyInList.length === 0) {
      this.modelLanesAndPools.push({id:laneOrPoolId, children:[]});
    }
  }

  // Connect tasks with lanes and pools
  loadTaskOntoParentLaneOrPool(parentId: String, taskId: String) {
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
  getListOfModelGroupStereotypes() {
    return this.groupStereotypesOnModel;
  }

  // Add a stereotype to the list of stereotypes with groups
  addStereotypeToTheListOfGroupStereotypesOnModel(stereotype: String) {
    if (this.groupStereotypesOnModel.indexOf(stereotype) === -1) {
      this.groupStereotypesOnModel.push(stereotype);
    }
  }

  // Check if task has a stereotype (by stereotype name)
  taskHasStereotype(task: any, stereotype: String) {
    if (task && task[(<any>stereotype)]) {
      return true;
    } else {
      return false;
    }
  }

  // Get group name of a stereotype if task has one
  getGroupOfTaskStereotypeIfTaskHasOne(taskId: String) {
    for (let stereotype of this.getListOfModelGroupStereotypes()) {
      let task = this.registry.get(taskId).businessObject;
      if (this.taskHasStereotype(task, stereotype)) {
        return (<any>this.elementsHandler.getTaskHandlerByTaskId(taskId).getTaskStereotypeInstanceByName(stereotype)).getGroup();
      }
    }
    return null;
  }

  // Return list of tasks with group stereotypes divided between lanes and pools
  getLanesAndPoolsWithTasksWithGroupStereotypes() {
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
      lanesAndPoolsWithTasksWithGroupStereotypes.push({id:laneOrPool.id, children:sorted, groups: groups});
    }
    return lanesAndPoolsWithTasksWithGroupStereotypes;
  }

  // Return the list of tasks with stereotype groups that are not in the same order on all lanes and pools
  getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
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
    return $.unique(problematicTasks);
  }

  // Check if the value is a number
  isInteger(value: any) {
    value = Number(value);
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
  }

  // Check if businessObject.name values are the same for all objects in the array
  areNamesUnique(array: any[]) {
    let tmpArr = [];
    for(let obj of array) {
      if (tmpArr.indexOf(obj.businessObject.name) < 0) {
        tmpArr.push(obj.businessObject.name);
      } else {
        return false;
      }
    }
    return true;
  }

  // Return number of occurences of the substring in the string
  occurrences(string: string, subString: string) {
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
  buildPaths(arr: any[], parent: any, c: any, result: any[]) {
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
  taskHasInputElement(taskId: String, elementId: String) {
    let elements = this.elementsHandler.getTaskHandlerByTaskId(taskId).getTaskInputObjects().filter(function( obj ) {
      return obj.id == elementId;
    });
    if (elements.length > 0) {
      return true;
    }
    return false;
  }

  // Check if specific element (by id) is one of the outputs of current task
  taskHasOutputElement(taskId: String, elementId: String) {
    let elements = this.elementsHandler.getTaskHandlerByTaskId(taskId).getTaskOutputObjects().filter(function( obj ) {
      return obj.id == elementId;
    });
    if (elements.length > 0) {
      return true;
    }
    return false;
  }

  // Check if specific task is in the incoming path of current task
  taskIsInIncomingPathOfTask(taskId: String, pathTaskId: String) {
    let task = this.registry.get(pathTaskId).businessObject;
    if (this.getTasksOfIncomingPathByInputElement(task).indexOf(taskId) !== -1) {
      return true;
    }
    return false;
  }

  // Check if specific task is in the outgoing path of current task
  taskIsInOutgoingPathOfTask(taskId: String, pathTaskId: String) {
    let task = this.registry.get(pathTaskId).businessObject;
    if (this.getTasksOfOutgoingPathByInputElement(task).indexOf(taskId) !== -1) {
      return true;
    }
    return false;
  }

  // Return true if at least one on inputObjects is an output of the task
  isOneOfInputObjectsInTaskStereotypeOutputs(taskId: String, inputObjects: any[]) {
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        let outputElements = this.getTaskOutputObjectsBasedOnTaskStereotype(task.id);
        if (outputElements) {
          let outputElementsNames = outputElements.map(a => a.businessObject.name.trim());
          let inputObjectsNames = inputObjects.map(a => a.businessObject.name.trim());
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

  // Find all data objects from the incoming path of input element (data object)
  findIncomingPathDataObjects(incDataObjects: any, input: any, sourceInputId: String) {
    if (!input) {
      return;
    }
    if (input.id != sourceInputId) {
      if (input.type === "bpmn:Task") {
        let flag = false;
        for (let element of input.incoming) {
          if (element.type === "bpmn:DataInputAssociation") {
            flag = true;
            break;
          }
        }
        if (!flag) {
          return;
        }
      }
      if (input.type === "bpmn:SequenceFlow") {
        return;
      }
      if (input.type === "bpmn:DataObjectReference") {
        incDataObjects.push(input.id);
      }
      if (input.sourceRef) {
        if (incDataObjects.filter(item => item == input.sourceRef.id).length > 5) {
          return;
        }
        this.findIncomingPathDataObjects(incDataObjects, input.sourceRef, sourceInputId);
      }
      if (input.incoming) {
        if (incDataObjects.filter(item => item == input.incoming.id).length > 5) {
          return;
        }
        this.findIncomingPathDataObjects(incDataObjects, input.incoming, sourceInputId);
      }
      if (input.source) {
        if (incDataObjects.filter(item => item == input.source.id).length > 5) {
          return;
        }
        this.findIncomingPathDataObjects(incDataObjects, input.source, sourceInputId);
      }
      if (input.type === "bpmn:StartEvent" || input.type === "bpmn:IntermediateCatchEvent") {
          for (let element of input.incoming) {
            this.findIncomingPathDataObjects(incDataObjects, element, sourceInputId);
          }
      }
      for (let element of input) {
        if (element.type === "bpmn:MessageFlow") {
          this.findIncomingPathDataObjects(incDataObjects, element.source, sourceInputId);
        }
        if (element.sourceRef) {
          if (element.type !== "bpmn:SequenceFlow") {
            this.findIncomingPathDataObjects(incDataObjects, element.sourceRef, sourceInputId);
          }
        }
        if (element.incoming) {
          if (incDataObjects.filter(item => item == element.incoming.id).length > 5) {
            return;
          }
          if (element.type !== "bpmn:SequenceFlow") {
            this.findIncomingPathDataObjects(incDataObjects, element.incoming, sourceInputId);
          }
        }
        if (element.source) {
          if (incDataObjects.filter(item => item == element.source.id).length > 5) {
            return;
          }
          if (element.type !== "bpmn:SequenceFlow") {
            this.findIncomingPathDataObjects(incDataObjects, element.source, sourceInputId);
          }
        }
      }
    }
  }

  // Find all tasks from the incoming path of task
  findIncomingPathTasks(incTasks: any, input: any, sourceInputId: String, type: String) {
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
      if (input.sourceRef) {
        this.findIncomingPathTasks(incTasks, input.sourceRef, sourceInputId, type);
      }
      if (input.incoming) {
        this.findIncomingPathTasks(incTasks, input.incoming, sourceInputId, type);
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
                  this.findIncomingPathTasks(incTasks, mF.sourceRef, sourceInputId, type);
                }
              }
            }
          }
        }
      }
      for (let element of input) {
        if (element.sourceRef) {
          this.findIncomingPathTasks(incTasks, element.sourceRef, sourceInputId, type);
        } else if (element.incoming) {
          this.findIncomingPathTasks(incTasks, element.incoming, sourceInputId, type);
        }
      }
    }
  }

  // Find all tasks from the outgoing path of task
  findOutgoingPathTasks(incTasks: any, input: any, sourceInputId: String, type: String) {
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
      for (let element of input) {
        if (element.targetRef) {
          this.findOutgoingPathTasks(incTasks, element.targetRef, sourceInputId, type);
        } else if (element.outgoing) {
          this.findOutgoingPathTasks(incTasks, element.outgoing, sourceInputId, type);
        }
      }
    }
  }

  // Find all exclusive gateways from the incoming path of task
  findIncomingPathExclusiveGateways(incGateways: any, input: any) {
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
    for (let element of input) {
      if (element.sourceRef) {
        this.findIncomingPathExclusiveGateways(incGateways, element.sourceRef);
      } else if (element.incoming) {
        this.findIncomingPathExclusiveGateways(incGateways, element.incoming);
      }
    }
  }

  // Find all StartEvent and IntermediateEvent elements from the incoming path of task
  findIncomingPathStartAndIntermediateEvents(incEvents: any, input: any, sourceInputId: String, incTasks: any) {
    if (!incEvents) {
      return;
    }
    if (!input || typeof(input) === "undefined") {
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
      for (let element of input) {
        if (element.sourceRef) {
          this.findIncomingPathStartAndIntermediateEvents(incEvents, element.sourceRef, sourceInputId, incTasks);
        } else if (element.incoming) {
          this.findIncomingPathStartAndIntermediateEvents(incEvents, element.incoming, sourceInputId, incTasks);
        }
      }
    }
  }

  // Return all tasks from the incoming path of task
  getTasksOfIncomingPathByInputElement(inputElement: any) {
    let incTasks = [];
    this.findIncomingPathTasks(incTasks, inputElement.incoming, inputElement.id, null);
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
              this.findIncomingPathTasks(incTasks, mF.sourceRef, inputElement.id, null);
            }
          }
        }
      }
    }
    return $.unique(incTasks);
  }

  // Return all data objects from the incoming path of element
  getDataObjectsOfIncomingPathByInputElement(inputElement: any) {
    let incDataObjectIds = [];
    this.findIncomingPathDataObjects(incDataObjectIds, inputElement.incoming, inputElement.id);
    let incDataObjects = [];
    for (let id of $.unique(incDataObjectIds)) {
      incDataObjects.push(this.registry.get(id));
    }
    return incDataObjects;
  }

  // Return all tasks from the outgoing path of task
  getTasksOfOutgoingPathByInputElement(inputElement: any) {
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
    return $.unique(outgTasks);
  }

  // Return all (first) tasks from the incoming path of element
  getFirstTasksOfIncomingPathOfInputElement(input: any) {
    let incTasks = [];
    this.findIncomingPathTasks(incTasks, input.incoming, input.id, "first");
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
              this.findIncomingPathTasks(incTasks, mF.sourceRef, input.id, "first");
            }
          }
        }
      }
    }
    return $.unique(incTasks);
  }

  // Return all (first) tasks from the outgoing path of element
  getFirstTasksOfOutgoingPathOfStartEventElements(input: any) {
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
    return $.unique(outgTasks);
  }

  // Return all exclusive gateways from the incoming path of element
  getExclusiveGatewaysOfIncomingPathOfInputElement(input: any) {
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
    return $.unique(incTasks);
  }

  // Return all StartEvent and IntermediateEvent elements from the incoming path of task
  getIncomingPathStartAndIntermediateEvents(task: any) {
    let events = [];
    let tasks = []
    if (task) {
      this.findIncomingPathStartAndIntermediateEvents(events, task.incoming, task.id, tasks);
    }
    return $.unique(events);
  }

  // Return all paths from the process of current task
  getAllPathsOfProcess(taskId: String) {
    let allPathsOfProcess = [];
    let processTask = this.registry.get(taskId).businessObject;
    let startEventElementsOfCurrentTaskProcess = this.getIncomingPathStartAndIntermediateEvents(processTask);
    for (let j = 0; j < startEventElementsOfCurrentTaskProcess.length; j++) {
      let relations = [];
      let uniqueRelations = [];
      let paths = [];

      for (let task of $.unique(this.getTasksOfOutgoingPathByInputElement(startEventElementsOfCurrentTaskProcess[j]))) {
        for (let firstIncomingTask of this.getFirstTasksOfIncomingPathOfInputElement(this.registry.get(task).businessObject)) {
          relations.push({key: task, parent: firstIncomingTask});
        }
      }

      for (let firstOutgoingTask of this.getFirstTasksOfOutgoingPathOfStartEventElements(startEventElementsOfCurrentTaskProcess[j])) {
        relations.push({key:firstOutgoingTask, parent: 'none'});
      }

      for (let relation of relations) {
        let relationAlreadyInRelations = uniqueRelations.filter(( obj ) => {
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

  // Return task output objects according to the stereotype
  getTaskOutputObjectsBasedOnTaskStereotype(taskId: String) {
    let outputObjects = null;
    if (taskId) {
      let task = this.registry.get(taskId);
      if (task) {
        if (task.businessObject.AddSSSharing || task.businessObject.FunSSSharing || task.businessObject.SSSharing || task.businessObject.PKEncrypt || task.businessObject.SKEncrypt || task.businessObject.PKComputation || task.businessObject.SKComputation || task.businessObject.SGXComputation || task.businessObject.SGXProtect || task.businessObject.ProtectConfidentiality || task.businessObject.OpenConfidentiality || task.businessObject.PETComputation) {
          outputObjects = this.elementsHandler.getTaskHandlerByTaskId(task.id).getTaskOutputObjects();
        } else if (task.businessObject.AddSSComputation) {
          outputObjects = this.elementsHandler.getTaskHandlerByTaskId(task.id).getTaskStereotypeInstanceByName("AddSSComputation").getAddSSComputationGroupOutputs(JSON.parse(this.registry.get(task.id).businessObject.AddSSComputation).groupId);
        } else if (task.businessObject.FunSSComputation) {
          outputObjects = this.elementsHandler.getTaskHandlerByTaskId(task.id).getTaskStereotypeInstanceByName("FunSSComputation").getFunSSComputationGroupOutputs(JSON.parse(this.registry.get(task.id).businessObject.FunSSComputation).groupId);
        } else if (task.businessObject.SSComputation) {
          outputObjects = this.elementsHandler.getTaskHandlerByTaskId(task.id).getTaskStereotypeInstanceByName("SSComputation").getSSComputationGroupOutputs(JSON.parse(this.registry.get(task.id).businessObject.SSComputation).groupId);
        }
      }
    }
    return outputObjects;
  }

  // Check if tasks (by id) are parallel
  areTasksParallel(taskIds: String[]) {
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
  areGroupsTasksInSameOrderOnAllPoolsAndLanes() {
    let problematicGroupsTasks = this.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
    if (problematicGroupsTasks.length > 0) {
      return false;
    }
    return true;
  }

  // Check if current task is in all paths that have exclusive gateways between their tasks
  areAllGroupTasksAccesibleForTask(taskId: String) {
    for (let paths of this.getAllPathsOfProcess(taskId)) {
      for (let path1 of paths) {
        for (let path2 of paths) {
          if (path1.toString() !== path2.toString()) {
            let len = path1.length;
            if (path2.length < len) {
              len = path2.length;
             }
            for (let i = 0; i < len; i ++) {
              if (path1[i] != path2[i]) {
                let gateways1 = this.getExclusiveGatewaysOfIncomingPathOfInputElement(this.registry.get(path2[i]).businessObject);
                let gateways2 = this.getExclusiveGatewaysOfIncomingPathOfInputElement(this.registry.get(path1[i]).businessObject);
                let common = $.grep(gateways1, (element) => {
                  return $.inArray(element, gateways2) !== -1;
                });
                if (common.length > 0) {
                  let subPath1 = path1.slice(i,path1.length);
                  let subPath2 = path2.slice(i,path2.length);
                  if (subPath1.indexOf(taskId) === -1 && subPath2.indexOf(taskId) !== -1 || subPath1.indexOf(taskId) !== -1 && subPath2.indexOf(taskId) === -1) {
                    return false;
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

  isThereAtLeastOneStartEventInCurrentTaskProcess(task: any) {
    let events = this.getIncomingPathStartAndIntermediateEvents(task);
    if (task && events.length > 0) {
      return true;
    }
    return false;
  }

  /* */
  setChangesInModelStatus(status: boolean) {
    this.elementsHandler.parent.setChangesInModelStatus(status);
  }

}