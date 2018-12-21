import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler } from './validation-handler';

declare let $: any;

export class DataDependenciesAnalysisHandler {

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

  viewer: Viewer;
  registry: any;
  eventBus: any;
  canvas: any;
  diagram: string;

  elementsHandler: ElementsHandler;
  validationHandler: ValidationHandler;

  analysisPanel: any;
  successPanel: any;

  parallelGroupStereotypes: string[] = [
    "AddSSComputation",
    "FunSSComputation",
    "GCComputation",
    "MPC",
    "OTReceive",
    "OTSend",
    "SSComputation"
  ];

  previousAnalysisresults: any[] = null;

  init(): void {
    this.analysisPanel.off('click', '#analyze-dependencies');
    this.analysisPanel.on('click', '#analyze-dependencies', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showResults();
    });
  }

  terminate(): void {
    this.analysisPanel.off('click', '#analyze-dependencies');
    this.analysisPanel.addClass('hidden');
    this.successPanel.addClass('hidden');
  }

  showResults(): void {
    let dependencies = this.getDataDependencies();
    if (this.previousAnalysisresults == null || this.previousAnalysisresults.toString() !== dependencies.toString()) {
      this.createDataDependenciesAnalysisReportTable();
    } else {
      $('#dataDependenciesAnalysisReportModal').modal();
    }
  }

  // Create data dependencies report table
  createDataDependenciesAnalysisReportTable(): void {
    let uniqueDataObjectNames = this.getListOfModelUniqueDataObjectNames();
    let rows = uniqueDataObjectNames.length;
    let columns = uniqueDataObjectNames.length;
    let dependencies = this.getDataDependencies();
    this.previousAnalysisresults = dependencies;

    $(document).find('#dataDependenciesAnalysisReportModal').find('.modal-dialog').removeClass('dd-transparent');

    let table = "";
    table += '<table class="table" style="text-align:center">';
    table += '<tr><th style="background-color:#f5f5f5; text-align:center;">#</th>';
    for (let c = 0; c < columns; c++) {
      table += '<th style="background-color:#f5f5f5; text-align:center;" class="dd-col-h dd-c-' + c + '">' + uniqueDataObjectNames[c] + '</th>';
    }
    table += '</tr>';
    for (let r = 0; r < rows; r++) {
      table += '<tr><td style="background-color:#f5f5f5;" class="dd-row-h dd-r-' + r + '"><b>' + uniqueDataObjectNames[r] + '</b></td>';
      for (let c = 0; c < columns; c++) {
        let value = '?';
        if (uniqueDataObjectNames[r] != uniqueDataObjectNames[c]) {
          let related = dependencies.filter((obj) => {
            return obj.row == uniqueDataObjectNames[r] && obj.col == uniqueDataObjectNames[c];
          });
          if (related.length === 1) {
            value = related[0].value;
            $(document).off('click', '.dd-' + r + '-' + c);
            $(document).on('click', '.dd-' + r + '-' + c, (e) => {
              this.initDataDepenenciesResultTableHiglights(related[0], r, c);
            });
          }
        } else {
          value = '#';
        }
        table += '<td class="dd-v dd-' + r + '-' + c + ' dd-col">' + value + '</td>';
      }
      table += '</tr>';
    }
    table += '</tabel>';

    $(document).off('click', '#transparency-button');
    $(document).on('click', '#transparency-button', (e) => {
      $(document).find('#dataDependenciesAnalysisReportModal').find('.modal-dialog').toggleClass('dd-transparent');
    });

    $('#dataDependenciesAnalysisReportModal').find('#report-table').html('');
    $('#dataDependenciesAnalysisReportModal').find('#report-table').html(table);
    $('#dataDependenciesAnalysisReportModal').find('#dependenciesAnalysisReportTitle').text('');
    $('#dataDependenciesAnalysisReportModal').find('#dependenciesAnalysisReportTitle').text($('#fileName').text());
    $('#dataDependenciesAnalysisReportModal').modal();
  }

  removeModelDependencyHiglights(): void {
    for (let dataObjectId of this.elementsHandler.getAllModelDataObjectHandlers().map(a => a.dataObject.id)) {
      this.canvas.removeMarker(dataObjectId, 'highlight-dd-input');
      this.canvas.removeMarker(dataObjectId, 'highlight-dd-output');
      this.canvas.removeMarker(dataObjectId, 'highlight-dd-between');
    }
    $(document).find('.dd-col-h, .dd-row-h').css('background-color', '#f5f5f5').css('color', 'black');
    $(document).find('.dd-col, .dd-row').css('background-color', 'white').css('color', 'black');
    $(document).find('#dataDependenciesAnalysisReportModal').find('.modal-dialog').removeClass('dd-transparent');
  }

  // Return list of unique (by name) data objects on the model
  getListOfModelUniqueDataObjectNames(): string[] {
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

  getDirectDataDependenciesRaw(withgroupRelations: boolean): any[] {
    let uniqueDataObjectNames = this.getListOfModelUniqueDataObjectNames();
    let dependencies = this.getDataObjectsDependencies();
    let rows = uniqueDataObjectNames.length;
    let columns = uniqueDataObjectNames.length;
    let directConnections = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        let value = '-';
        if (withgroupRelations && this.areDataObjectsFromSameStereotypeGroup(uniqueDataObjectNames[r], uniqueDataObjectNames[c])) {
          value = 'D';
        }
        if (uniqueDataObjectNames[r] != uniqueDataObjectNames[c]) {
          let hasRelations = dependencies.filter((obj) => {
            return obj.name === uniqueDataObjectNames[r];
          });
          if (hasRelations.length !== 0) {
            if (hasRelations[0].connections.indexOf(uniqueDataObjectNames[c]) !== -1) {
              if (this.isThereACommonParentForDataObjects(uniqueDataObjectNames[r], uniqueDataObjectNames[c])) {
                value = 'D';
              }
            }
          }
        }
        if (value == "D") {
          directConnections.push({ key: uniqueDataObjectNames[r], parent: uniqueDataObjectNames[c] });
        }
      }
    }
    return directConnections;
  }

  getDirectDataDependencies(): any[] {
    let rawDependencies = this.getDirectDataDependenciesRaw(true);
    let directDependencies = [];

    for (let dependency of rawDependencies) {
      let path = { input: dependency.parent, output: dependency.key, between: [] };
      directDependencies.push({ row: dependency.key, col: dependency.parent, value: 'D', path: path });
    }
    return directDependencies;
  }

  getInDirectDataDependencies(): any[] {
    let uniqueDataObjectNames = this.getListOfModelUniqueDataObjectNames();
    let directDependencies = this.getDirectDataDependencies();
    let inDirectConnections = [];
    let directConnectionsParents = [];
    let pathsConsideringGroupRelations = [];
    let pathsNotConsideringGroupRelations = [];

    for (let dataObjectName of uniqueDataObjectNames) {
      directConnectionsParents.push({ key: dataObjectName, parent: 'none' });
    }

    this.validationHandler.buildPaths(this.getDirectDataDependenciesRaw(true).concat(directConnectionsParents), 'none', '', pathsConsideringGroupRelations);
    this.validationHandler.buildPaths(this.getDirectDataDependenciesRaw(false).concat(directConnectionsParents), 'none', '', pathsNotConsideringGroupRelations);

    for (let r = 0; r < uniqueDataObjectNames.length; r++) {
      for (let c = 0; c < uniqueDataObjectNames.length; c++) {
        if (uniqueDataObjectNames[r] != uniqueDataObjectNames[c]) {
          let hasPath = pathsConsideringGroupRelations.filter(obj => {
            return obj.indexOf(uniqueDataObjectNames[r]) !== -1 && obj.indexOf(uniqueDataObjectNames[c]) !== -1;
          });
          for (let path of hasPath) {
            let i1 = path.indexOf(uniqueDataObjectNames[r]);
            let i2 = path.indexOf(uniqueDataObjectNames[c]);
            let subpath = path.slice(i1, i2 + 1);
            let betweenNames = subpath.slice(1, subpath.length - 1);
            if (i2 - i1 > 1) {
              let value = 'I';
              let alreadyAdded = inDirectConnections.filter((obj) => {
                return obj.row == uniqueDataObjectNames[c] && obj.col == uniqueDataObjectNames[r];
              });
              let isDirectConnection = directDependencies.filter((obj) => {
                return obj.row == uniqueDataObjectNames[c] && obj.col == uniqueDataObjectNames[r];
              });
              if (isDirectConnection.length === 0) {
                if (alreadyAdded.length === 0) {
                  inDirectConnections.push({ row: uniqueDataObjectNames[c], col: uniqueDataObjectNames[r], value: value, path: { input: subpath[0], output: subpath[subpath.length - 1], between: betweenNames } });
                } else {
                  let hasPath_2 = pathsNotConsideringGroupRelations.filter(obj => {
                    return obj.indexOf(uniqueDataObjectNames[r]) !== -1 && obj.indexOf(uniqueDataObjectNames[c]) !== -1;
                  });
                  for (let path_2 of hasPath_2) {
                    let i1_2 = path_2.indexOf(uniqueDataObjectNames[r]);
                    let i2_2 = path_2.indexOf(uniqueDataObjectNames[c]);
                    let subpath_2 = path_2.slice(i1_2, i2_2 + 1);
                    let betweenNames_2 = subpath_2.slice(1, subpath_2.length - 1);
                    if (i2_2 - i1_2 > 1) {
                      alreadyAdded[0].path = { input: alreadyAdded[0].path.input, output: alreadyAdded[0].path.output, between: betweenNames_2 };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return inDirectConnections;
  }

  getDataDependencies(): any[] {
    let uniqueDataObjectNames = this.getListOfModelUniqueDataObjectNames();
    let rows = uniqueDataObjectNames.length;
    let columns = uniqueDataObjectNames.length;
    let directDependencies = this.getDirectDataDependencies();
    let inDirectDependencies = this.getInDirectDataDependencies();
    let dependencies = directDependencies.concat(inDirectDependencies);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        if (uniqueDataObjectNames[r] != uniqueDataObjectNames[c]) {
          let isDirectConnection = directDependencies.filter((obj) => {
            return obj.row == uniqueDataObjectNames[c] && obj.col == uniqueDataObjectNames[r];
          });
          if (isDirectConnection.length === 0) {
            let isInDirectConnection = inDirectDependencies.filter((obj) => {
              return obj.row == uniqueDataObjectNames[c] && obj.col == uniqueDataObjectNames[r];
            });
            if (isInDirectConnection.length === 0) {
              let path = { input: uniqueDataObjectNames[r], output: uniqueDataObjectNames[c], between: [] };
              dependencies.push({ row: uniqueDataObjectNames[c], col: uniqueDataObjectNames[r], value: '-', path: path });
            }
          }
        } else {
          let path = { input: null, output: null, between: [] };
          dependencies.push({ row: uniqueDataObjectNames[c], col: uniqueDataObjectNames[r], value: '#', path: path });
        }
      }
    }
    return dependencies;
  }

  initDataDepenenciesResultTableHiglights(clickedDataObject: any, row: number, col: number): void {
    this.removeModelDependencyHiglights();
    $(document).find('#dataDependenciesAnalysisReportModal').find('.modal-dialog').addClass('dd-transparent');
    $(document).find('.dd-col-h, .dd-row-h').css('background-color', '#f5f5f5').css('color', 'black');
    $(document).find('.dd-col, .dd-row').css('background-color', 'white').css('color', 'black');
    $(document).find('.dd-c-' + col).css('background-color', 'springgreen').css('color', 'white');
    $(document).find('.dd-r-' + row).css('background-color', 'lightcoral').css('color', 'white');
    $(document).find('.dd-' + row + '-' + col).css('background-color', 'deepskyblue').css('color', 'white');

    let inputs = this.elementsHandler.getDataObjectHandlersByDataObjectName(clickedDataObject.path.input);
    for (let input of inputs) {
      this.canvas.addMarker(input.dataObject.id, 'highlight-dd-input');
    }

    let outputs = this.elementsHandler.getDataObjectHandlersByDataObjectName(clickedDataObject.path.output);
    for (let output of outputs) {
      this.canvas.addMarker(output.dataObject.id, 'highlight-dd-output');
    }

    for (let betweens of clickedDataObject.path.between) {
      for (let between of this.elementsHandler.getDataObjectHandlersByDataObjectName(betweens)) {
        this.canvas.addMarker(between.dataObject.id, 'highlight-dd-between');
      }
    }
  }

  // Return information about data objects that are related to each other
  getDataObjectsDependencies(): any[] {
    let dependencies = [];
    let allDataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    for (let dataObjectHandler of allDataObjectHandlers) {
      for (let parentTask of dataObjectHandler.getDataObjectIncomingParentTasks()) {
        let parentOutputs = this.elementsHandler.getTaskHandlerByTaskId(parentTask.id).getTaskOutputObjects();
        for (let dO of parentOutputs) {
          let dataObjectAlreadyInList = dependencies.filter((obj) => {
            return obj.name === dO.businessObject.name.trim();
          });
          if (dataObjectAlreadyInList.length !== 0) {
            dataObjectAlreadyInList[0].connections = this.getUniqueValuesOfArray(dataObjectAlreadyInList[0].connections.concat(this.getDataObjectsOfIncomingPathByInputElement(dO).map(a => a.businessObject.name.trim())));
          } else {
            if (dO.businessObject.name) {
              dependencies.push({ name: dO.businessObject.name.trim(), connections: this.getUniqueValuesOfArray(this.getDataObjectsOfIncomingPathByInputElement(dO).map(a => a.businessObject.name.trim())) });
            }
          }
        }
      }
    }
    dependencies = dependencies.sort(this.compareNames);
    return dependencies;
  }

  // Check if two data objects (by name) have at least one same parent (by name)
  isThereACommonParentForDataObjects(dataObject1Name: string, dataObject2Name: string): boolean {
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

  // Check if two data objects (by name) have at least one same parent (by name) which belong to the same stereotype group
  areDataObjectsFromSameStereotypeGroup(dataObject1Name: string, dataObject2Name: string): boolean {
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
        let p1H = this.elementsHandler.getTaskHandlerByTaskId(parent1.id);
        let p2H = this.elementsHandler.getTaskHandlerByTaskId(parent2.id);
        for (let stereotype1 of p1H.stereotypes) {
          for (let stereotype2 of p2H.stereotypes) {
            if (stereotype1.title && stereotype2.title && stereotype1.title == stereotype2.title) {
              if (this.parallelGroupStereotypes.indexOf(stereotype1.title) !== -1 && this.parallelGroupStereotypes.indexOf(stereotype2.title) !== -1) {
                if (stereotype1.group && stereotype2.group && stereotype1.group.trim() == stereotype2.group.trim()) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
    return false;
  }

  // Return all data objects from the incoming path of element
  getDataObjectsOfIncomingPathByInputElement(inputElement: any): any[] {
    let incDataObjectIds = [];
    let messageFlowInputs = [];
    this.findIncomingPathDataObjects(incDataObjectIds, inputElement.incoming, inputElement.id, messageFlowInputs);
    let incDataObjects = [];
    for (let id of this.getUniqueValuesOfArray(incDataObjectIds)) {
      incDataObjects.push(this.registry.get(id));
    }
    return incDataObjects;
  }

  // Find all data objects from the incoming path of input element (data object)
  findIncomingPathDataObjects(incDataObjects: any, input: any, sourceInputId: string, messageFlowInputs: any): void {
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
      if (input.type === "bpmn:DataObjectReference" || input.type === "bpmn:DataStoreReference") {
        incDataObjects.push(input.id);
      }
      if (input.sourceRef) {
        if (incDataObjects.filter(item => item == input.sourceRef.id).length > 5) {
          return;
        }
        this.findIncomingPathDataObjects(incDataObjects, input.sourceRef, sourceInputId, messageFlowInputs);
      }
      if (input.incoming) {
        if (incDataObjects.filter(item => item == input.incoming.id).length > 5) {
          return;
        }
        this.findIncomingPathDataObjects(incDataObjects, input.incoming, sourceInputId, messageFlowInputs);
      }
      if (input.source) {
        if (incDataObjects.filter(item => item == input.source.id).length > 5) {
          return;
        }
        this.findIncomingPathDataObjects(incDataObjects, input.source, sourceInputId, messageFlowInputs);
      }
      if (input.type === "bpmn:StartEvent" || input.type === "bpmn:IntermediateCatchEvent") {
        for (let element of input.incoming) {
          this.findIncomingPathDataObjects(incDataObjects, element, sourceInputId, messageFlowInputs);
        }
      }
      for (let element of input) {
        if (element.type === "bpmn:MessageFlow") {
          messageFlowInputs.push(element.id);
          if (messageFlowInputs.filter(item => item == element.id).length > 5) {
            return;
          }
          this.findIncomingPathDataObjects(incDataObjects, element.source, sourceInputId, messageFlowInputs);
        }
        if (element.sourceRef) {
          if (element.type !== "bpmn:SequenceFlow") {
            this.findIncomingPathDataObjects(incDataObjects, element.sourceRef, sourceInputId, messageFlowInputs);
          }
        }
        if (element.incoming) {
          if (incDataObjects.filter(item => item == element.incoming.id).length > 5) {
            return;
          }
          if (element.type !== "bpmn:SequenceFlow") {
            this.findIncomingPathDataObjects(incDataObjects, element.incoming, sourceInputId, messageFlowInputs);
          }
        }
        if (element.source) {
          if (incDataObjects.filter(item => item == element.source.id).length > 5) {
            return;
          }
          if (element.type !== "bpmn:SequenceFlow") {
            this.findIncomingPathDataObjects(incDataObjects, element.source, sourceInputId, messageFlowInputs);
          }
        }
      }
    }
  }

  getOutgoingDataObjectInstancesByName(dataObjectName: string): any[] {
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

  getIncomingDataObjectInstancesByName(dataObjectName: string): any[] {
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

  // Compare object name properties
  compareNames(a: any, b: any): number {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }

  // Get unique values of an array
  getUniqueValuesOfArray(array: string[]): string[] {
    return array.filter((v, i, a) => a.indexOf(v) === i);
  }

}