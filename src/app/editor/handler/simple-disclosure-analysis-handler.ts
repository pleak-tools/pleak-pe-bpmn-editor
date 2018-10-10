import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler } from './validation-handler';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class SimpleDisclosureAnalysisHandler {

  constructor(viewer: Viewer, diagram: String, elementsHandler: ElementsHandler, validationHandler: ValidationHandler) {
    this.viewer = viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.eventBus = this.viewer.get('eventBus');
    this.canvas = this.viewer.get('canvas');
    this.diagram = diagram;
    this.elementsHandler = elementsHandler;
    this.validationHandler = validationHandler;
    this.analysisPanel = validationHandler.analysisPanel;
    this.successPanel = validationHandler.successPanel;
  }

  viewer: Viewer;
  registry: any;
  eventBus: any;
  canvas: any;
  diagram: String;

  elementsHandler: ElementsHandler;
  validationHandler: ValidationHandler;

  analysisPanel: any;
  successPanel: any;

  init() {
    this.analysisPanel.off('click', '#analyze-simple-disclosure');
    this.analysisPanel.on('click', '#analyze-simple-disclosure', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showResults();
    });
  }

  terminate() {
    this.analysisPanel.off('click', '#analyze-simple-disclosure');
    this.analysisPanel.addClass('hidden');
    this.successPanel.addClass('hidden');
  }

  showResults() {
    this.createSimpleDisclosureReportTable();
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

  // Return list of lanes and pools with their names
  getListOfModelLanesAndPoolsObjects() {
    let lanesAndPools = this.validationHandler.getModelLanesAndPools();
    let lanesAndPoolsObjects = [];
    let index = 1;
    let index2 = 1;
    for (let laneOrPool of lanesAndPools) {
      if (this.registry.get(laneOrPool.id).businessObject.name) {
        lanesAndPoolsObjects.push({id: laneOrPool.id, name: this.registry.get(laneOrPool.id).businessObject.name.trim(), children: laneOrPool.children});
      } else {
        if (this.registry.get(laneOrPool.id).businessObject && this.registry.get(laneOrPool.id).type === "bpmn:Participant") {
          lanesAndPoolsObjects.push({id: laneOrPool.id, name: "Unnamed pool " + index, children: laneOrPool.children});
          index++;
        }
        if (this.registry.get(laneOrPool.id).type === "bpmn:Lane") {
          if (this.registry.get(laneOrPool.id).parent.businessObject.name) {
            lanesAndPoolsObjects.push({id: laneOrPool.id, name: this.registry.get(laneOrPool.id).parent.businessObject.name.trim(), children: laneOrPool.children});
          } else if (this.registry.get(laneOrPool.id).parent.businessObject)  {
            lanesAndPoolsObjects.push({id: laneOrPool.id, name: "Unnamed lane " + index2, children: laneOrPool.children});
            index2++;
          }
        }
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

  // Check if task has a stereotype (by stereotype name)
  messageFlowHasStereotype(messageFlow: any, stereotype: String) {
    if (messageFlow && messageFlow[(<any>stereotype)]) {
      return true;
    } else {
      return false;
    }
  }

  // Compare object name properties
  compareNames(a: any, b: any) {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }

}