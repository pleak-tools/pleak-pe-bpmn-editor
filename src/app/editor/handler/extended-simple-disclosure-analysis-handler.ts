import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler } from './validation-handler';
import { SimpleDisclosureAnalysisHandler } from './simple-disclosure-analysis-handler';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class ExtendedSimpleDisclosureAnalysisHandler2 {

  constructor(viewer: Viewer, elementsHandler: ElementsHandler, validationHandler: ValidationHandler) {
    this.viewer = viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.elementsHandler = elementsHandler;
    this.validationHandler = validationHandler;
    this.analysisPanel = validationHandler.analysisPanel;
    this.successPanel = validationHandler.successPanel;
  }

  viewer: Viewer;
  registry: any;

  elementsHandler: ElementsHandler;
  validationHandler: ValidationHandler;
  simpleDisclosureAnalysisHandler: SimpleDisclosureAnalysisHandler;

  analysisPanel: any;
  successPanel: any;

  init(simpleDisclosureAnalysisHandler: SimpleDisclosureAnalysisHandler) {
    this.simpleDisclosureAnalysisHandler = simpleDisclosureAnalysisHandler;
    this.analysisPanel.off('click', '#extended-analyze-simple-disclosure');
    this.analysisPanel.on('click', '#extended-analyze-simple-disclosure', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let uniqueDataObjects = this.simpleDisclosureAnalysisHandler.getListOfModelUniqueDataObjects();
      let newMatrix = this.getMtrx(uniqueDataObjects);

      this.showResults(this.simpleDisclosureAnalysisHandler.getListOfModelLanesAndPoolsObjects().length, uniqueDataObjects.length, this.simpleDisclosureAnalysisHandler.getListOfModelLanesAndPoolsObjects(), newMatrix, this.simpleDisclosureAnalysisHandler.getDataObjectGroupsMessageFlowConnections(uniqueDataObjects));
    });

  }

  getMtrx(uniqueDataObjects) {
    let simpleDisclosureMatrix = this.simpleDisclosureAnalysisHandler.getSimpleDisclosureDataMatrix(uniqueDataObjects);
    let newMatrix = JSON.parse(JSON.stringify(simpleDisclosureMatrix));

    let dd = this.validationHandler.dataDependenciesAnalysisHandler.getDataDependencies();
    for (let cell of newMatrix) {
      if (cell.visibility == "V") {
        // Row in DD, based on cell name
        let row1 = dd.filter((obj) => {
          return obj.row.trim() == cell.name.trim();
        });
        if (row1.length > 0) {

          // Row in SD (to be updated)
          let row2 = newMatrix.filter((obj) => {
            return obj.visibleTo == cell.visibleTo;
          });
          if (row2.length > 0) {

            // Cells in the SD row
            for (let x of row2) {

              // Cell matching with the name in DD row
              let k = row1.filter((obj) => {
                return obj.col.trim() == x.name.trim();
              })
              if (k.length > 0) {


                if (k[0].value != "-" && k[0].value != "#") {
                  let kk = newMatrix.filter((obj) => {
                    return obj.visibleTo == cell.visibleTo && obj.name.trim() == k[0].col.trim();
                  })[0];
                  if (kk.visibility != "O" && kk.visibility != "V") {
                    if (kk.visibility.indexOf(k[0].value) == -1) {
                      kk.visibility += ", " + k[0].value;
                    }
                  }
                }
              }
            }
          }

        }

      }
    }
    return newMatrix;
  }

  getExtendedSimpleDisclosureReportTable() {
    let uniqueDataObjects = this.simpleDisclosureAnalysisHandler.getListOfModelUniqueDataObjects();
    let matrix = this.getMtrx(uniqueDataObjects);

    return {
      simpleDisclosureDataObjects: matrix,
      uniqueLanesAndPools: this.simpleDisclosureAnalysisHandler.getListOfModelLanesAndPoolsObjects(),
      dataObjectGroupsMessageFlowConnections: this.simpleDisclosureAnalysisHandler.getDataObjectGroupsMessageFlowConnections(this.simpleDisclosureAnalysisHandler.getListOfModelUniqueDataObjects())
    };
  }

  showResults(rows, columns, uniqueLanesAndPools, simpleDisclosureDataObjects, dataObjectGroupsMessageFlowConnections) {
    let uniqueDataObjects = this.simpleDisclosureAnalysisHandler.getListOfModelUniqueDataObjects();

    let tmp = [];
    for (let dO of uniqueDataObjects) {
      for (let cell of simpleDisclosureDataObjects) {
        let visibilityObject = {visibility: cell.visibility, visibleTo: ""};
      }
    }

    let table = "";
    table += '<table class="table" style="text-align:center">';
    table += '<tr><th style="background-color:#f5f5f5; text-align:center;">#</th>';
    for (let col of uniqueDataObjects) {
      table += '<th style="background-color:#f5f5f5; text-align:center; vertical-align: middle;">' + col.name.trim() + '</th>';
    }
    table += '</tr>';

    for (let row of uniqueLanesAndPools) {
      table += '<tr>';
      table += '<td style="background-color:#f5f5f5;vertical-align:middle"><b>' + row.name.trim() + '</b></td>';

      for (let col of uniqueDataObjects) {
        let connectionInfo = simpleDisclosureDataObjects.filter((obj) => {
          return obj.name.trim() == col.name.trim() && obj.visibleTo == row.id;
        });
        if (connectionInfo.length > 0) {
          let visibilityValues = connectionInfo[0].visibility.split(", ");
          let visibilityStr = visibilityValues.length > 1 ? visibilityValues[0] + "<br>" + visibilityValues.slice(1, visibilityValues.length).join(", ") : visibilityValues[0] + "<br>";
          table += '<td>' + visibilityStr + '</td>';

        } else {
          table += '<td>-</td>';
        }
      }
      table += '</tr>';
    }

    // if (dataObjectGroupsMessageFlowConnections) {
    //   table += '<tr><td colspan="' + (columns + 1) + '"></td></tr><tr><td>Shared over</td>'
    //   for (let c2 = 0; c2 < columns; c2++) {
    //     let connectionInfo = dataObjectGroupsMessageFlowConnections.filter((obj) => {
    //       return obj.name == simpleDisclosureDataObjects[c2].name;
    //     });
    //     if (connectionInfo.length !== 0) {
    //       table += '<td>' + connectionInfo[0].type + '</td>';
    //     } else {
    //       table += '<td>-</td>';
    //     }
    //   }
    //   table += '</tr>';
    // }

    table += '</table>';

    $('#simple-legend').text('V = visible, H = hidden, O = owner, MF = MessageFlow, S = SecureChannel, D = direct, I = indirect');
    $('#simpleDisclosureReportModal').find('#report-table').html('').html(table);
    $('#simpleDisclosureReportModal').find('#simpleDisclosureReportTitle').text('').text($('#fileName').text());
    $('#simpleDisclosureReportModal').find('#simpleDisclosureReportType').text(' - Extended simple disclosure analysis report');
    $('#simpleDisclosureReportModal').modal();
  }

}