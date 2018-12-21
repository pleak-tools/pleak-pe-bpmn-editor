import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler } from './validation-handler';

declare let $: any;

export class SimpleDisclosureAnalysisHandler {

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

  groupStereotypes: string[] = [ // grouping based on stereotype groups
    "AddSSComputation",
    "FunSSComputation",
    "SSComputation"
  ];

  inputOutputGroupedStereotypes: string[] = [ // grouping inputs and outputs
    "AddSSSharing",
    "FunSSSharing",
    "SSSharing",
    "AddSSReconstruction",
    "FunSSReconstruction",
    "SSReconstruction",
    "SGXProtect",
    "ProtectConfidentiality",
    "OpenConfidentiality"
  ];

  encryptStereotypes: string[] = [ // grouping plain- and ciphertext
    "SKEncrypt",
    "PKEncrypt"
  ];

  decryptStereotypes: string[] = [ // grouping cipher- and plaintext
    "SKDecrypt",
    "PKDecrypt"
  ];


  init(): void {
    this.analysisPanel.off('click', '#analyze-simple-disclosure');
    this.analysisPanel.on('click', '#analyze-simple-disclosure', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showResults();
    });
  }

  terminate(): void {
    this.analysisPanel.off('click', '#analyze-simple-disclosure');
    this.analysisPanel.addClass('hidden');
    this.successPanel.addClass('hidden');
  }

  showResults(): void {
    this.createSimpleDisclosureReportTable();
  }

  // Get simple disclosure data (containing only V and H information)
  getSimpleDisclosureData(): any[] {
    let uniqueDataObjectsByName = this.getListOfModelUniqueDataObjects();
    let resultData = [];

    for (let dataObjectObj of uniqueDataObjectsByName) {
      let visibility = "-";
      let visibilityDataOriginal = this.getUniqueValuesOfArray(dataObjectObj.visibility);
      let visibilityData = [];
      let visibilityObj = { name: dataObjectObj.name, visibleTo: dataObjectObj.visibleTo, visibility: visibility }
      for (let vData of visibilityDataOriginal) {
        visibilityData.push(vData.split("-")[0]);
      }
      visibilityData = this.getUniqueValuesOfArray(visibilityData);
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
      visibilityObj.visibility = visibility;
      resultData.push(visibilityObj);
    }

    return resultData;
  }

  // Get simple disclosure data for all participant - data object relation (contains V, H and - information)
  getSimpleDisclosureDataMatrix(): any[] {
    let simpleDisclosureData = this.getSimpleDisclosureData();
    let uniqueDataObjectsByName = this.getListOfModelUniqueDataObjects();
    let modelParticipants = this.getListOfModelLanesAndPoolsObjects();
    let simpleDisclosureDataMatrix = [];

    for (let dataObjectInfo of simpleDisclosureData) {
      for (let visibleToParticipant of dataObjectInfo.visibleTo) {
        let dataObjectAlreadyAdded = simpleDisclosureDataMatrix.filter((obj) => {
          return obj.name == dataObjectInfo.name && obj.visibleTo == visibleToParticipant;
        });
        if (dataObjectAlreadyAdded.length === 0) {
          simpleDisclosureDataMatrix.push({ name: dataObjectInfo.name, visibleTo: visibleToParticipant, visibility: dataObjectInfo.visibility });
        }
      }
    }
    for (let dataObject of uniqueDataObjectsByName) {
      for (let participant of modelParticipants) {
        let dataObjectAlreadyAdded = simpleDisclosureDataMatrix.filter((obj) => {
          return obj.name == dataObject.name && obj.visibleTo == participant.id;
        });
        if (dataObjectAlreadyAdded.length === 0) {
          simpleDisclosureDataMatrix.push({ name: dataObject.name, visibleTo: participant.id, visibility: "-" });
        }
      }
    }
    return simpleDisclosureDataMatrix;
  }

  // Get data objects groups based on stereotypes
  getDataObjectsGroupsBasedOnStereotypes(): any[] {
    let simpleDisclosureData = this.getSimpleDisclosureData();
    let taskHandlers = this.elementsHandler.getAllModelTaskHandlers();
    let stereotypeBasedDataObjectsGroupInfo = [];

    for (let taskHandler of taskHandlers) {
      for (let stereotype of taskHandler.stereotypes) {
        // Grouping based on group stereotypes
        if (this.groupStereotypes.indexOf(stereotype.getTitle()) !== -1) {
          for (let outputObj of taskHandler.getTaskOutputObjects()) {
            let dataObjectExists = simpleDisclosureData.filter((obj) => {
              return obj.name.trim() == outputObj.businessObject.name.trim();
            });
            if (dataObjectExists.length !== -1) {
              let groupInfo = stereotype.getTitle() + "-" + (<any>stereotype).getGroup();
              stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
            }
          }
        }
        // Grouping inputs and outputs
        if (this.inputOutputGroupedStereotypes.indexOf(stereotype.getTitle()) !== -1) {
          for (let inputObj of taskHandler.getTaskInputObjects()) {
            let dataObjectExists = simpleDisclosureData.filter((obj) => {
              return obj.name.trim() == inputObj.businessObject.name.trim();
            });
            if (dataObjectExists.length !== -1) {
              let groupInfo = stereotype.getTitle() + "-" + taskHandler.task.id;
              stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
            }
          }
          for (let outputObj of taskHandler.getTaskOutputObjects()) {
            let dataObjectExists = simpleDisclosureData.filter((obj) => {
              return obj.name.trim() == outputObj.businessObject.name.trim();
            });
            if (dataObjectExists.length !== -1) {
              let groupInfo = stereotype.getTitle() + "-" + taskHandler.task.id;
              stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
            }
          }
        }
        // Grouping plain- and ciphertext (encryption)
        if (this.encryptStereotypes.indexOf(stereotype.getTitle()) !== -1) {
          if (taskHandler.task[(<any>stereotype.getTitle())] != null) {
            let inputDataId = JSON.parse(taskHandler.task[(<any>stereotype.getTitle())]).inputData;
            let inputDataObject = this.registry.get(inputDataId);
            let inputDataObjectname = inputDataObject.businessObject.name;
            let dataObjectExists = simpleDisclosureData.filter((obj) => {
              return obj.name.trim() == inputDataObjectname.trim();
            });
            if (dataObjectExists.length !== -1) {
              let groupInfo = stereotype.getTitle() + "-" + taskHandler.task.id;
              stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
            }
            for (let outputObj of taskHandler.getTaskOutputObjects()) {
              let dataObjectExists = simpleDisclosureData.filter((obj) => {
                return obj.name.trim() == outputObj.businessObject.name.trim();
              });
              if (dataObjectExists.length !== -1) {
                let groupInfo = stereotype.getTitle() + "-" + taskHandler.task.id;
                stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
              }
            }
          }
        }
        // Grouping cipher- and plaintext (decryption)
        if (this.decryptStereotypes.indexOf(stereotype.getTitle()) !== -1) {
          if (taskHandler.task[(<any>stereotype.getTitle())] != null) {
            let ciphertextDataId = JSON.parse(taskHandler.task[(<any>stereotype.getTitle())]).ciphertext;
            let ciphertextDataObject = this.registry.get(ciphertextDataId);
            let ciphertextDataObjectname = ciphertextDataObject.businessObject.name;
            let dataObjectExists = simpleDisclosureData.filter((obj) => {
              return obj.name.trim() == ciphertextDataObjectname.trim();
            });
            if (dataObjectExists.length !== -1) {
              let groupInfo = stereotype.getTitle() + "-" + taskHandler.task.id;
              stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
            }
            for (let outputObj of taskHandler.getTaskOutputObjects()) {
              let dataObjectExists = simpleDisclosureData.filter((obj) => {
                return obj.name.trim() == outputObj.businessObject.name.trim();
              });
              if (dataObjectExists.length !== -1) {
                let groupInfo = stereotype.getTitle() + "-" + taskHandler.task.id;
                stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
              }
            }
          }
        }
      }
    }

    let stereotypeBasedDataObjectsGroups = [];
    for (let tt of stereotypeBasedDataObjectsGroupInfo) {
      let dataObjectAlreadyAdded = stereotypeBasedDataObjectsGroups.filter((obj) => {
        return obj.group == tt.group;
      });
      if (dataObjectAlreadyAdded.length === 0) {
        stereotypeBasedDataObjectsGroups.push({ group: tt.group, dataObjects: [tt.dataObjectName] });
      } else {
        dataObjectAlreadyAdded[0].dataObjects.push(tt.dataObjectName);
      }
    }

    return stereotypeBasedDataObjectsGroups;
  }

  // Get raw simple disclosure (unformatted for report tabel) data ojects groups
  getSimpleDisclosureReportColumnGroupsRaw(): any[] {
    let dataObjectsGroupsBasedOnStereotypes = this.getDataObjectsGroupsBasedOnStereotypes();
    let getSimpleDisclosureDataMatrix = this.getSimpleDisclosureDataMatrix();
    let groups = dataObjectsGroupsBasedOnStereotypes.map(a => ({ ...a }));
    let dataObjectsNames = this.getUniqueValuesOfArray(getSimpleDisclosureDataMatrix.map(a => a.name));
    let dataObjectsOfGroups = [].concat.apply([], groups.map(a => a.dataObjects));
    let frawDataObjectsGroupData = [];

    // Add missing groups (dataObjects)
    for (let dO of dataObjectsNames) {
      if (dataObjectsOfGroups.indexOf(dO) === -1) {
        groups.push({ group: dO, dataObjects: [dO] });
      }
    }

    // Merge groups that have common elements
    for (let dO of dataObjectsNames) {
      let matchingGroups = groups.filter((obj) => {
        return obj.dataObjects.indexOf(dO) !== -1;
      });
      if (matchingGroups.length > 0) {
        let dataObjects = [].concat.apply([], matchingGroups.map(a => a.dataObjects));
        let newGroup = { group: matchingGroups.map(a => a.group).join('-'), dataObjects: this.getUniqueValuesOfArray(dataObjects) };
        for (let group of matchingGroups) {
          groups = groups.filter((obj) => {
            return obj.group !== group.group;
          });
        }
        groups.push(newGroup);
      }
    }

    // Change the format of group objects
    groups.map(group => {
      frawDataObjectsGroupData.push({ name: group.dataObjects.sort().join(",<br>"), dataObjects: group.dataObjects });
    });

    return frawDataObjectsGroupData;
  }

  // Format and sort simple disclosure report data objects groups data
  getSimpleDisclosureReportColumnGroups(): any[] {
    let getSimpleDisclosureDataMatrix = this.getSimpleDisclosureDataMatrix();
    let modelParticipants = this.getListOfModelLanesAndPoolsObjects();
    let simpleDisclosureReportColumnGroupsRawData = this.getSimpleDisclosureReportColumnGroupsRaw();
    let formattedDataObjectsGroupData = [];

    for (let rawDataObjectsGroup of simpleDisclosureReportColumnGroupsRawData) {
      let visibilityData = [];
      for (let participant of modelParticipants) {
        let visibility = [];
        for (let dataObject of rawDataObjectsGroup.dataObjects) {
          let visibilityInfoExists = getSimpleDisclosureDataMatrix.filter((obj) => {
            return obj.visibleTo == participant.id && obj.name == dataObject;
          });
          if (visibilityInfoExists.length !== 0) {
            visibility.push(visibilityInfoExists[0].visibility);
          }
        }
        let visibilityValue = "-";
        if (visibility.indexOf("V") !== -1) {
          visibilityValue = "V";
        } else if (visibility.indexOf("H") !== -1 && visibility.indexOf("V") === -1) {
          visibilityValue = "H";
        }
        visibilityData.push({ visibleTo: participant.id, visibility: visibilityValue });
      }
      formattedDataObjectsGroupData.push({ name: rawDataObjectsGroup.name, visibility: visibilityData });
    }

    return formattedDataObjectsGroupData.sort(function (a, b) {
      var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
      if (nameA < nameB)
        return -1
      if (nameA > nameB)
        return 1
      return 0
    });
  }

  // Return list of connections between data objects groups and message flows
  getDataObjectGroupsMessageFlowConnections(): any[] {
    let dataObjectMessageFlowConnections = this.getListOfModeldataObjectsAndMessageFlowConnections();
    let simpleDisclosureReportColumnGroupsRawData = this.getSimpleDisclosureReportColumnGroupsRaw();
    let dataObjectGroupsMessageFlowConnections = [];

    for (let rawDataObjectsGroup of simpleDisclosureReportColumnGroupsRawData) {
      let connectionTypes = [];
      for (let dataObject of rawDataObjectsGroup.dataObjects) {
        let connectionInfoExists = dataObjectMessageFlowConnections.filter((obj) => {
          return obj.dataObject == dataObject;
        });
        if (connectionInfoExists.length !== 0) {
          for (let type of connectionInfoExists[0].types) {
            connectionTypes.push(type);
          }
        } else {
          connectionTypes.push("-");
        }
      }
      let typeValue = "-";
      if (connectionTypes.indexOf("MF") !== -1) {
        typeValue = "MF";
      } else if (connectionTypes.indexOf("S") !== -1 && connectionTypes.indexOf("MF") === -1) {
        typeValue = "S";
      }
      dataObjectGroupsMessageFlowConnections.push({ name: rawDataObjectsGroup.name, type: typeValue });
    }

    return dataObjectGroupsMessageFlowConnections;
  }

  // Create simple disclosure report table
  createSimpleDisclosureReportTable(): void {
    let uniqueLanesAndPools = this.getListOfModelLanesAndPoolsObjects();
    let simpleDisclosureDataObjects = this.getSimpleDisclosureReportColumnGroups();
    let dataObjectGroupsMessageFlowConnections = this.getDataObjectGroupsMessageFlowConnections();;
    let rows = uniqueLanesAndPools.length;
    let columns = simpleDisclosureDataObjects.length;

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
    table += '</tabel>';
    $('#simpleDisclosureReportModal').find('#report-table').html('').html(table);
    $('#simpleDisclosureReportModal').find('#simpleDisclosureReportTitle').text('').text(this.elementsHandler.parent.file.title);
    $('#simpleDisclosureReportModal').modal();
  }

  // Return list of lanes and pools with their names
  getListOfModelLanesAndPoolsObjects(): any[] {
    let lanesAndPools = this.validationHandler.getModelLanesAndPools();
    let lanesAndPoolsObjects = [];
    let index = 1;
    let index2 = 1;
    for (let laneOrPool of lanesAndPools) {
      if (this.registry.get(laneOrPool.id).businessObject.name) {
        lanesAndPoolsObjects.push({ id: laneOrPool.id, name: this.registry.get(laneOrPool.id).businessObject.name.trim(), children: laneOrPool.children });
      } else {
        if (this.registry.get(laneOrPool.id).businessObject && this.registry.get(laneOrPool.id).type === "bpmn:Participant") {
          lanesAndPoolsObjects.push({ id: laneOrPool.id, name: "Unnamed pool " + index, children: laneOrPool.children });
          index++;
        }
        if (this.registry.get(laneOrPool.id).type === "bpmn:Lane") {
          if (this.registry.get(laneOrPool.id).parent.businessObject.name) {
            lanesAndPoolsObjects.push({ id: laneOrPool.id, name: this.registry.get(laneOrPool.id).parent.businessObject.name.trim(), children: laneOrPool.children });
          } else if (this.registry.get(laneOrPool.id).parent.businessObject) {
            lanesAndPoolsObjects.push({ id: laneOrPool.id, name: "Unnamed lane " + index2, children: laneOrPool.children });
            index2++;
          }
        }
      }
    }
    lanesAndPoolsObjects = lanesAndPoolsObjects.sort(this.compareNames);
    return lanesAndPoolsObjects;
  }

  // Return list of data objects (unique by their name)
  getListOfModelUniqueDataObjects(): any[] {
    let dataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    let uniqueDataObjectsByName = [];
    for (let dataObjectHandler of dataObjectHandlers) {
      let visibleTo = this.getUniqueValuesOfArray(dataObjectHandler.getLanesAndPoolsDataObjectIsVisibleTo());
      let visibility = dataObjectHandler.getVisibilityStatus();
      if (dataObjectHandler.dataObject.name) {
        let dataObjectAlreadyAdded = uniqueDataObjectsByName.filter((obj) => {
          return obj.name.trim() == dataObjectHandler.dataObject.name.trim();
        });
        if (dataObjectAlreadyAdded.length > 0) {
          dataObjectAlreadyAdded[0].visibleTo = this.getUniqueValuesOfArray(dataObjectAlreadyAdded[0].visibleTo.concat(visibleTo));
          dataObjectAlreadyAdded[0].visibility = this.getUniqueValuesOfArray(dataObjectAlreadyAdded[0].visibility.concat(visibility));
        } else {
          uniqueDataObjectsByName.push({ name: dataObjectHandler.dataObject.name.trim(), visibleTo: visibleTo, visibility: visibility });
        }
      }
    }
    uniqueDataObjectsByName = uniqueDataObjectsByName.sort(this.compareNames);
    return uniqueDataObjectsByName;
  }

  // Return list of dataObjects that are moved over MessageFlow / SecureChannel
  getListOfModeldataObjectsAndMessageFlowConnections(): any[] {
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
        let messageFlowAlreadyInList = messageFlowObjects.filter((obj) => {
          return obj.dataObject == dObject;
        });
        if (messageFlowAlreadyInList.length === 0) {
          messageFlowObjects.push({ dataObject: dObject, types: oTypes });
        } else {
          messageFlowAlreadyInList[0].types = this.getUniqueValuesOfArray(messageFlowAlreadyInList[0].types.concat(oTypes));
        }
      }
    }
    return messageFlowObjects;
  }

  // Check if task has a stereotype (by stereotype name)
  messageFlowHasStereotype(messageFlow: any, stereotype: string): boolean {
    if (messageFlow && messageFlow[(<any>stereotype)]) {
      return true;
    } else {
      return false;
    }
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