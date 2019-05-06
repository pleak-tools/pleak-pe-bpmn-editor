import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler } from './validation-handler';
import { SimpleDisclosureAnalysisHandler } from './simple-disclosure-analysis-handler';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class ExtendedSimpleDisclosureAnalysisHandler {

  constructor(viewer: Viewer, diagram: string, elementsHandler: ElementsHandler, validationHandler: ValidationHandler) {
    this.viewer = viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.eventBus = this.viewer.get('eventBus');
    this.canvas = this.viewer.get('canvas');
    this.diagram = diagram;
    this.elementsHandler = elementsHandler;
    this.validationHandler = validationHandler;
    this.analysisPanel = validationHandler.analysisPanel;
    this.successPanel = validationHandler.successPanel;
    ExtendedSimpleDisclosureAnalysisHandler.dtoOwners = {};
  }

  init(simpleDisclosureAnalysisHandler: SimpleDisclosureAnalysisHandler){
    let self = this;
    ExtendedSimpleDisclosureAnalysisHandler.simpleDisclosureAnalysisHandler = simpleDisclosureAnalysisHandler;
    this.analysisPanel.off('click', '#extended-analyze-simple-disclosure');
    this.analysisPanel.on('click', '#extended-analyze-simple-disclosure', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let res = self.createSimpleDisclosureReportTable();
      self.showResults(res.uniqueLanesAndPools.length, res.simpleDisclosureDataObjects.length, res.uniqueLanesAndPools, res.simpleDisclosureDataObjects, res.dataObjectGroupsMessageFlowConnections)
    });
  }

  viewer: Viewer;
  registry: any;
  eventBus: any;
  canvas: any;
  diagram: string;
  static dtoOwners: any = {};

  elementsHandler: ElementsHandler;
  validationHandler: ValidationHandler;
  static simpleDisclosureAnalysisHandler: SimpleDisclosureAnalysisHandler;

  analysisPanel: any;
  successPanel: any;

  getSimpleDisclosureData(): any[] {
    let uniqueDataObjectsByName = ExtendedSimpleDisclosureAnalysisHandler.simpleDisclosureAnalysisHandler.getListOfModelUniqueDataObjects();
    let resultData = [];

    for (let dataObjectObj of uniqueDataObjectsByName) {
      let visibility = "-";
      let visibilityDataOriginal = this.validationHandler.getUniqueValuesOfArray(dataObjectObj.visibility);
      let visibilityData = [];
      let visibilityObj = { id: dataObjectObj.id, owner: null, name: dataObjectObj.name, visibleTo: dataObjectObj.visibleTo, visibility: visibility }
      for (let vData of visibilityDataOriginal) {
        visibilityData.push(vData.split("-")[0]);
      }
      visibilityData = this.validationHandler.getUniqueValuesOfArray(visibilityData);
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

      let registry = this.registry;
      visibilityObj.owner = dataObjectObj.owner;
      if (visibility == "V" && !!dataObjectObj.visibleTo.find(x => x == dataObjectObj.owner)) {
        let isInitialOwner = false;
        let isDtoInputFound = false;
        for (var i in registry._elements) {
          var node = registry._elements[i].element;
          if ((is(node.businessObject, 'bpmn:Task'))) {
            if (node.businessObject.dataOutputAssociations && node.businessObject.dataOutputAssociations.length) {
              node.businessObject.dataOutputAssociations.forEach(x => {
                if (x.targetRef.id == dataObjectObj.id) {
                  isInitialOwner = true;
                }
              });
              if (isInitialOwner) {
                break;
              }
            }
          }
          if (is(node.businessObject, 'bpmn:DataObjectReference') &&
            (node.businessObject.id == dataObjectObj.id) &&
            node.incoming && node.incoming.length) {
            isDtoInputFound = true;
          }
        }

        if (isInitialOwner || !isDtoInputFound) {
          visibility = "O";
        }
        else {
          visibility = "V";
        }
      }

      visibilityObj.visibility = visibility;
      resultData.push(visibilityObj);
    }

    return resultData;
  }

  getSimpleDisclosureReportColumnGroups(): any[] {
    let getSimpleDisclosureDataMatrix = ExtendedSimpleDisclosureAnalysisHandler.simpleDisclosureAnalysisHandler.getSimpleDisclosureDataMatrix();
    let formattedDataObjectsGroupData = [];

    let grouped = [];
    for (let i = 0; i < getSimpleDisclosureDataMatrix.length; i++) {
      let existingDto = grouped.find(x => x.name == getSimpleDisclosureDataMatrix[i].name);
      if (getSimpleDisclosureDataMatrix[i].visibleTo != getSimpleDisclosureDataMatrix[i].owner &&
        getSimpleDisclosureDataMatrix[i].visibility == "O") {
        getSimpleDisclosureDataMatrix[i].visibility = "V";
      }

      if (existingDto) {
        existingDto.visibility.push({
          visibility: getSimpleDisclosureDataMatrix[i].visibility,
          visibleTo: getSimpleDisclosureDataMatrix[i].visibleTo
        });
      }
      else {
        // let visibility = getSimpleDisclosureDataMatrix[i].visibleTo != getSimpleDisclosureDataMatrix[i].owner && 
        // getSimpleDisclosureDataMatrix[i].visibility == "O";
        grouped.push({
          name: getSimpleDisclosureDataMatrix[i].name,
          visibility: [{
            visibility: getSimpleDisclosureDataMatrix[i].visibility,
            visibleTo: getSimpleDisclosureDataMatrix[i].visibleTo
          }]
        });
      }
    }

    formattedDataObjectsGroupData = grouped;

    return formattedDataObjectsGroupData.sort(function (a, b) {
      var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
      if (nameA < nameB)
        return -1
      if (nameA > nameB)
        return 1
      return 0
    });
  }

  createSimpleDisclosureReportTable(): any {
    let deps = this.validationHandler.dataDependenciesAnalysisHandler.getDataDependencies();
    let uniqueLanesAndPools = ExtendedSimpleDisclosureAnalysisHandler.simpleDisclosureAnalysisHandler.getListOfModelLanesAndPoolsObjects();
    let simpleDisclosureDataObjects = this.getSimpleDisclosureReportColumnGroups();
    let dataObjectGroupsMessageFlowConnections = ExtendedSimpleDisclosureAnalysisHandler.simpleDisclosureAnalysisHandler.getDataObjectGroupsMessageFlowConnections();

    for (let i = 0; i < simpleDisclosureDataObjects.length; i++) {
      for (let v = 0; v < simpleDisclosureDataObjects[i].visibility.length; v++) {
        if (simpleDisclosureDataObjects[i].visibility[v].visibility == '-') {

          let foundDiscs = [];
          for (let j = 0; j < deps.length; j++) {
            if (deps[j].col == simpleDisclosureDataObjects[i].name &&
              ExtendedSimpleDisclosureAnalysisHandler.dtoOwners[deps[j].row] == simpleDisclosureDataObjects[i].visibility[v].visibleTo) {
              if (deps[j].value != '-' && !foundDiscs.find(x => x == deps[j].value)) {
                foundDiscs.push(deps[j].value);
              }
            }
          }

          if (foundDiscs.length) {
            simpleDisclosureDataObjects[i].visibility[v].visibility = foundDiscs.join(', ');
          }
        }
      }
    }

    return {
      simpleDisclosureDataObjects: simpleDisclosureDataObjects,
      uniqueLanesAndPools: uniqueLanesAndPools,
      dataObjectGroupsMessageFlowConnections: dataObjectGroupsMessageFlowConnections
    };
  }

  showResults(rows, columns, uniqueLanesAndPools, simpleDisclosureDataObjects, dataObjectGroupsMessageFlowConnections){
    let table = "";
    table += '<table class="table" style="text-align:center">';
    table += '<tr><th style="background-color:#f5f5f5; text-align:center;">#</th>';
    for (let c = 0; c < columns; c++) {
      table += '<th style="background-color:#f5f5f5; text-align:center; vertical-align: middle;">' + simpleDisclosureDataObjects[c].name + '</th>';
    }
    table += '</tr>';
    for (let r = 0; r < rows; r++) {
      table += '<tr><td style="background-color:#f5f5f5;"><b>' + uniqueLanesAndPools[r].name + '</b></td>';
      for (let c = 0; c < columns; c++) {
        let visibilityInfoExists = simpleDisclosureDataObjects[c].visibility.filter((obj) => {
          return obj.visibleTo == uniqueLanesAndPools[r].id;
        });
        if (visibilityInfoExists.length !== 0) {
          table += '<td>' + visibilityInfoExists[0].visibility + '</td>';
        } else {
          table += '<td>?</td>';
        }
      }
      table += '</tr>';
    }
    if (dataObjectGroupsMessageFlowConnections) {
      table += '<tr><td colspan="' + (columns + 1) + '"></td></tr><tr><td>Shared over</td>'
      for (let c2 = 0; c2 < columns; c2++) {
        let connectionInfo = dataObjectGroupsMessageFlowConnections.filter((obj) => {
          return obj.name == simpleDisclosureDataObjects[c2].name;
        });
        if (connectionInfo.length !== 0) {
          table += '<td>' + connectionInfo[0].type + '</td>';
        } else {
          table += '<td>-</td>';
        }
      }
      table += '</tr>';
    }
    table += '</table>';

    $('#simple-legend').text('V = visible, H = hidden, O = owner, MF = MessageFlow, S = SecureChannel, D = direct, I = indirect');
    $('#simpleDisclosureReportModal').find('#report-table').html('').html(table);
    $('#simpleDisclosureReportModal').find('#simpleDisclosureReportTitle').text('').text(this.elementsHandler.parent.file.title);
    $('#simpleDisclosureReportModal').find('#simpleDisclosureReportType').text(' - Extended simple disclosure analysis report');
    $('#simpleDisclosureReportModal').modal();
  }

  getListOfModelUniqueDataObjects(): any[] {
    let dataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    let uniqueDataObjectsByName = [];
    for (let dataObjectHandler of dataObjectHandlers) {
      let visibleTo = this.validationHandler.getUniqueValuesOfArray(dataObjectHandler.getLanesAndPoolsDataObjectIsVisibleTo());
      let visibility = dataObjectHandler.getVisibilityStatus();
      let owner = null;

      let registry = this.registry;
      for (var i in registry._elements) {
        if (registry._elements[i].element.type == "bpmn:Participant") {
          let curPart = registry._elements[i].element;

          for (var j = 0; j < curPart.children.length; j++) {
            if (curPart.children[j].type == "bpmn:DataObjectReference" &&
              curPart.children[j].businessObject &&
              dataObjectHandler.dataObject.id == curPart.children[j].businessObject.id) {
                ExtendedSimpleDisclosureAnalysisHandler.dtoOwners[dataObjectHandler.dataObject.name] = curPart.id;
              owner = curPart.id;
              break;
            }
          }
        }
      }

      if (dataObjectHandler.dataObject.name) {
        let dataObjectAlreadyAdded = uniqueDataObjectsByName.filter((obj) => {
          return obj.id == dataObjectHandler.dataObject.id;
        });
        if (dataObjectAlreadyAdded.length > 0) {
          dataObjectAlreadyAdded[0].id = dataObjectHandler.dataObject.id;
          dataObjectAlreadyAdded[0].owner = owner;
          dataObjectAlreadyAdded[0].visibleTo = this.validationHandler.getUniqueValuesOfArray(dataObjectAlreadyAdded[0].visibleTo.concat(visibleTo));
          dataObjectAlreadyAdded[0].visibility = this.validationHandler.getUniqueValuesOfArray(dataObjectAlreadyAdded[0].visibility.concat(visibility));
        } else {
          uniqueDataObjectsByName.push({ id: dataObjectHandler.dataObject.id, name: dataObjectHandler.dataObject.name.trim(), owner: owner, visibleTo: visibleTo, visibility: visibility });
        }
      }
    }
    uniqueDataObjectsByName = uniqueDataObjectsByName.sort(this.compareNames);
    return uniqueDataObjectsByName;
  }

  compareNames(a: any, b: any): number {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }

}