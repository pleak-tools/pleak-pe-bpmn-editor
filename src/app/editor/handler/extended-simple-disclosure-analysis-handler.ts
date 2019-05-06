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

  elementsHandler: ElementsHandler;
  validationHandler: ValidationHandler;
  static simpleDisclosureAnalysisHandler: SimpleDisclosureAnalysisHandler;

  analysisPanel: any;
  successPanel: any;

  createSimpleDisclosureReportTable(): any {
    let deps = this.validationHandler.dataDependenciesAnalysisHandler.getDataDependencies();
    let uniqueLanesAndPools = ExtendedSimpleDisclosureAnalysisHandler.simpleDisclosureAnalysisHandler.getListOfModelLanesAndPoolsObjects();
    let simpleDisclosureDataObjects = ExtendedSimpleDisclosureAnalysisHandler.simpleDisclosureAnalysisHandler.getSimpleDisclosureReportColumnGroups();
    let dataObjectGroupsMessageFlowConnections = ExtendedSimpleDisclosureAnalysisHandler.simpleDisclosureAnalysisHandler.getDataObjectGroupsMessageFlowConnections();

    for (let i = 0; i < simpleDisclosureDataObjects.length; i++) {
      for (let v = 0; v < simpleDisclosureDataObjects[i].visibility.length; v++) {
        if (simpleDisclosureDataObjects[i].visibility[v].visibility == '-') {

          let foundDiscs = [];
          for (let j = 0; j < deps.length; j++) {
            if (deps[j].col == simpleDisclosureDataObjects[i].name &&
              ExtendedSimpleDisclosureAnalysisHandler.simpleDisclosureAnalysisHandler.dtoOwners[deps[j].row] == simpleDisclosureDataObjects[i].visibility[v].visibleTo) {
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
}