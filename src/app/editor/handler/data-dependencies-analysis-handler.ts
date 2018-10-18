import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler } from './validation-handler';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class DataDependenciesAnalysisHandler {

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
    this.analysisPanel.off('click', '#analyze-dependencies');
    this.analysisPanel.on('click', '#analyze-dependencies', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showResults();
    });
  }

  terminate() {
    this.analysisPanel.off('click', '#analyze-dependencies');
    this.analysisPanel.addClass('hidden');
    this.successPanel.addClass('hidden');
  }

  showResults() {
    this.createDataDependenciesAnalysisReportTable();
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

  // Return all data objects from the incoming path of element
  getDataObjectsOfIncomingPathByInputElement(inputElement: any) {
    let incDataObjectIds = [];
    let messageFlowInputs = [];
    this.findIncomingPathDataObjects(incDataObjectIds, inputElement.incoming, inputElement.id, messageFlowInputs);
    let incDataObjects = [];
    for (let id of $.unique(incDataObjectIds)) {
      incDataObjects.push(this.registry.get(id));
    }
    return incDataObjects;
  }

  // Find all data objects from the incoming path of input element (data object)
  findIncomingPathDataObjects(incDataObjects: any, input: any, sourceInputId: String, messageFlowInputs: any) {
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

  // Compare object name properties
  compareNames(a: any, b: any) {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }

}