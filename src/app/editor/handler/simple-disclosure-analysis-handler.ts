import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler } from './validation-handler';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

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
    this.dtoOwners = {};
  }

  viewer: Viewer;
  registry: any;
  eventBus: any;
  canvas: any;
  diagram: string;
  dtoOwners: any;

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
  getSimpleDisclosureData(uniqueDataObjectsByName: any[]): any[] {
    let resultData = [];

    for (let dataObjectObj of uniqueDataObjectsByName) {
      let visibility = "-";
      let visibilityDataOriginal = this.validationHandler.getUniqueValuesOfArray(dataObjectObj.visibility);
      let visibilityData = [];
      let visibilityObj = { id: dataObjectObj.id, name: dataObjectObj.name, visibleTo: dataObjectObj.visibleTo, visibility: visibility }
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

      visibilityObj.visibility = visibility;
      resultData.push(visibilityObj);
    }

    return resultData;
  }

  // Get simple disclosure data for all participant - data object relation (contains V, H and - information)
  public getSimpleDisclosureDataMatrix(uniqueDataObjectsByName: any[]): any[] {
    let simpleDisclosureData = this.getSimpleDisclosureData(uniqueDataObjectsByName);
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

    // Finding owners (O values) of dataobjects
    for (let cell of simpleDisclosureDataMatrix) {
      let allDataObjects = this.elementsHandler.getAllModelDataObjectHandlers().map((dO) => dO.dataObject).filter((dO) => {
        return dO.name && dO.name.trim() == cell.name.trim() && this.registry.get(dO.id).incoming.length === 0 && this.registry.get(dO.id).outgoing.length > 0;
      });
      for (let dO of allDataObjects) {
        let dataObject = this.registry.get(dO.id);
        for (let oG of dataObject.outgoing) {

          if (oG.target) {
            let exists = this.validationHandler.getModelLanesAndPools().filter((obj) => {
              return obj.children.indexOf(oG.target.id) !== -1;
            });
            if (exists.length !== 0) {
              if (exists[0].id == cell.visibleTo) {
                cell.visibility = "O";
              }
            }
          }
        }
      }
    }

    // Filter out parent pools/participants/lanes that are not used
    let filtered = [];
    for (let cell of simpleDisclosureDataMatrix) {
      for (let part of modelParticipants) {
        if (cell.visibleTo == part.id) {
          filtered.push(cell);
        }
      }
    }

    return filtered;
  }

  // Get data objects groups based on stereotypes
  getDataObjectsGroupsBasedOnStereotypes(uniqueDataObjects): any[] {
    let simpleDisclosureData = this.getSimpleDisclosureData(uniqueDataObjects);
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
            if (dataObjectExists.length > 0) {
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
            if (dataObjectExists.length > 0) {
              let groupInfo = stereotype.getTitle() + "-" + taskHandler.task.id;
              stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
            }
          }
          for (let outputObj of taskHandler.getTaskOutputObjects()) {
            let dataObjectExists = simpleDisclosureData.filter((obj) => {
              return obj.name.trim() == outputObj.businessObject.name.trim();
            });
            if (dataObjectExists.length > 0) {
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
            if (dataObjectExists.length > 0) {
              let groupInfo = stereotype.getTitle() + "-" + taskHandler.task.id;
              stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
            }
            for (let outputObj of taskHandler.getTaskOutputObjects()) {
              let dataObjectExists = simpleDisclosureData.filter((obj) => {
                return obj.name.trim() == outputObj.businessObject.name.trim();
              });
              if (dataObjectExists.length > 0) {
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
            if (dataObjectExists.length > 0) {
              let groupInfo = stereotype.getTitle() + "-" + taskHandler.task.id;
              stereotypeBasedDataObjectsGroupInfo.push({ dataObjectName: dataObjectExists[0].name, group: groupInfo });
            }
            for (let outputObj of taskHandler.getTaskOutputObjects()) {
              let dataObjectExists = simpleDisclosureData.filter((obj) => {
                return obj.name.trim() == outputObj.businessObject.name.trim();
              });
              if (dataObjectExists.length > 0) {
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
  getSimpleDisclosureReportColumnGroupsRaw(uniqueDataObjectsByName): any[] {
    let dataObjectsGroupsBasedOnStereotypes = this.getDataObjectsGroupsBasedOnStereotypes(uniqueDataObjectsByName);
    let getSimpleDisclosureDataMatrix = this.getSimpleDisclosureDataMatrix(uniqueDataObjectsByName);
    let groups = dataObjectsGroupsBasedOnStereotypes.map(a => ({ ...a }));
    let dataObjectsNames = this.validationHandler.getUniqueValuesOfArray(getSimpleDisclosureDataMatrix.map(a => a.name));
    let dataObjectsIds = this.validationHandler.getUniqueValuesOfArray(getSimpleDisclosureDataMatrix.map(a => a.id));
    let dataObjectsOfGroups = [].concat.apply([], groups.map(a => a.dataObjects));
    let frawDataObjectsGroupData = [];


    // Add missing groups (dataObjects)
    for (let i = 0; i < dataObjectsNames.length; i++) {
      let dO = dataObjectsNames[i];
      if (dataObjectsOfGroups.indexOf(dO) === -1) {
        groups.push({ id: dataObjectsIds[i], group: dO, dataObjects: [dO] });
      }
    }

    // Merge groups that have common elements
    for (let i = 0; i < dataObjectsNames.length; i++) {
      let dO = dataObjectsNames[i];
      let matchingGroups = groups.filter((obj) => {
        return obj.dataObjects.indexOf(dO) !== -1;
      });
      if (matchingGroups.length > 0) {
        let dataObjects = [].concat.apply([], matchingGroups.map(a => a.dataObjects));
        let newGroup = { id: dataObjectsIds[i], group: matchingGroups.map(a => a.group).join('-'), dataObjects: this.validationHandler.getUniqueValuesOfArray(dataObjects) };
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
      frawDataObjectsGroupData.push({ id: group.id, name: group.dataObjects.sort().join(",<br>"), dataObjects: group.dataObjects });
    });

    return frawDataObjectsGroupData;
  }

  // Format and sort simple disclosure report data objects groups data
  getSimpleDisclosureReportColumnGroups(): any[] {
    let uniqueDataObjects = this.getListOfModelUniqueDataObjects();
    let getSimpleDisclosureDataMatrix = this.getSimpleDisclosureDataMatrix(uniqueDataObjects);
    let modelParticipants = this.getListOfModelLanesAndPoolsObjects();
    let simpleDisclosureReportColumnGroupsRawData = this.getSimpleDisclosureReportColumnGroupsRaw(uniqueDataObjects);
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
        if (visibility.indexOf("O") !== -1) {
          visibilityValue = "O";
        } else if (visibility.indexOf("V") !== -1) {
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

  getColumnGroupsForExtendedSimpleDisclosure(uniqueDataObjectsByName: any[]): any[] {
    let getSimpleDisclosureDataMatrix = this.getSimpleDisclosureDataMatrix(uniqueDataObjectsByName);
    let formattedDataObjectsGroupData = [];

    let grouped = [];
    for (let i = 0; i < getSimpleDisclosureDataMatrix.length; i++) {
      let existingDto = grouped.find(x => x.name == getSimpleDisclosureDataMatrix[i].name);
      if (existingDto) {
        existingDto.visibility.push({
          visibility: getSimpleDisclosureDataMatrix[i].visibility,
          visibleTo: getSimpleDisclosureDataMatrix[i].visibleTo
        });
      } else {
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


  // Return list of connections between data objects groups and message flows
  public getDataObjectGroupsMessageFlowConnections(uniqueDataObjectsByName: any[]): any[] {
    let dataObjectMessageFlowConnections = this.getListOfModeldataObjectsAndMessageFlowConnections();
    let simpleDisclosureReportColumnGroupsRawData = this.getSimpleDisclosureReportColumnGroupsRaw(uniqueDataObjectsByName);
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
      if (connectionTypes.indexOf("MF-V") !== -1) {
        typeValue = "MF-V";
      } else if (connectionTypes.indexOf("MF-H") !== -1 && connectionTypes.indexOf("MF-V") === -1) {
        typeValue = "MF-H";
      } else if (connectionTypes.indexOf("S") !== -1 && connectionTypes.indexOf("MF-V") === -1) {
        typeValue = "S";
      }
      dataObjectGroupsMessageFlowConnections.push({ name: rawDataObjectsGroup.name, type: typeValue });
    }
    return dataObjectGroupsMessageFlowConnections;
  }

  // Create simple disclosure report table
  public createSimpleDisclosureReportTable(): void {

    let uniqueLanesAndPools = this.getListOfModelLanesAndPoolsObjects();
    let simpleDisclosureDataObjects = this.getSimpleDisclosureReportColumnGroups();
    let dataObjectGroupsMessageFlowConnections = this.getDataObjectGroupsMessageFlowConnections(this.getListOfModelUniqueDataObjects());
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
    $('#simple-legend').text('V = visible, H = hidden, O = owner, MF = MessageFlow, S = SecureChannel');
    $('#simpleDisclosureReportModal').find('#report-table').html('').html(table);
    $('#simpleDisclosureReportModal').find('#simpleDisclosureReportTitle').text('').text($('#fileName').text());
    $('#simpleDisclosureReportModal').find('#simpleDisclosureReportType').text(' - Simple disclosure analysis report');
    $('#simpleDisclosureReportModal').modal();
  }

  // Return list of lanes and pools with their names
  public getListOfModelLanesAndPoolsObjects(): any[] {
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
      let visibleTo = this.validationHandler.getUniqueValuesOfArray(dataObjectHandler.getLanesAndPoolsDataObjectIsVisibleTo());
      let visibility = dataObjectHandler.getVisibilityStatus();
      if (dataObjectHandler.dataObject.name) {
        let dataObjectAlreadyAdded = uniqueDataObjectsByName.filter((obj) => {
          return obj.name.trim() == dataObjectHandler.dataObject.name.trim();
        });
        if (dataObjectAlreadyAdded.length > 0) {
          dataObjectAlreadyAdded[0].visibleTo = this.validationHandler.getUniqueValuesOfArray(dataObjectAlreadyAdded[0].visibleTo.concat(visibleTo));
          dataObjectAlreadyAdded[0].visibility = this.validationHandler.getUniqueValuesOfArray(dataObjectAlreadyAdded[0].visibility.concat(visibility));
        } else {
          uniqueDataObjectsByName.push({ name: dataObjectHandler.dataObject.name.trim(), visibleTo: visibleTo, visibility: visibility });
        }
      }
    }
    uniqueDataObjectsByName = uniqueDataObjectsByName.sort(this.compareNames);
    return uniqueDataObjectsByName;
  }

  getListOfModelUniqueDataObjectsForExtendedSimpleDisclosure(): any[] {
    let dataObjectHandlers = this.elementsHandler.getAllModelDataObjectHandlers();
    let uniqueDataObjectsByName = [];
    for (let dataObjectHandler of dataObjectHandlers) {
      let visibleTo = this.validationHandler.getUniqueValuesOfArray(dataObjectHandler.getLanesAndPoolsDataObjectIsVisibleTo());
      let visibility = dataObjectHandler.getVisibilityStatus();

      // TODO - compute dtowners correctly!!!
      let registry = this.registry;
      for (var i in registry._elements) {
        if (registry._elements[i].element.type == "bpmn:Participant") {
          let curPart = registry._elements[i].element;

          for (var j = 0; j < curPart.children.length; j++) {
            if (curPart.children[j].type == "bpmn:DataObjectReference" && curPart.children[j].businessObject && dataObjectHandler.dataObject.id == curPart.children[j].businessObject.id) {
              this.dtoOwners[dataObjectHandler.dataObject.name] = curPart.id;
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
          dataObjectAlreadyAdded[0].visibleTo = this.validationHandler.getUniqueValuesOfArray(dataObjectAlreadyAdded[0].visibleTo.concat(visibleTo));
          dataObjectAlreadyAdded[0].visibility = this.validationHandler.getUniqueValuesOfArray(dataObjectAlreadyAdded[0].visibility.concat(visibility));
        } else {
          uniqueDataObjectsByName.push({ id: dataObjectHandler.dataObject.id, name: dataObjectHandler.dataObject.name.trim(), visibleTo: visibleTo, visibility: visibility });
        }
      }
    }
    uniqueDataObjectsByName = uniqueDataObjectsByName.sort(this.compareNames);
    return uniqueDataObjectsByName;
  }



  // Return list of dataObjects that are moved over MessageFlow / SecureChannel
  public getListOfModeldataObjectsAndMessageFlowConnections(): any[] {
    let messageFlowHandlers = this.elementsHandler.getAllModelMessageFlowHandlers();
    let messageFlowObjects = [];
    let simpleDisclosureDataMatrix = this.getSimpleDisclosureDataMatrix(this.getListOfModelUniqueDataObjects());
    for (let messageFlowHandler of messageFlowHandlers) {
      let messageFlowInputs = messageFlowHandler.getMessageFlowInputObjects();
      let sourceElement = this.registry.get(messageFlowHandler.messageFlow.sourceRef.id);
      let sourceParent = sourceElement.parent;
      if (sourceElement && sourceElement.businessObject) {
        if (sourceElement.businessObject.lanes) {
          if (sourceElement.businessObject.lanes.length > 1) {
            for (let lane of sourceElement.businessObject.lanes) {
              if (!lane.childLaneSet) {
                sourceParent = lane;
              }
            }
          } else {
            sourceParent = sourceElement.businessObject.lanes[0];
          }
        } else {
          sourceParent = sourceElement.parent;
        }
      }
      for (let input of messageFlowInputs) {
        let inputHandler = this.elementsHandler.getDataObjectHandlerByDataObjectId(input.businessObject.id);
        let inputObjects = simpleDisclosureDataMatrix.filter((cell) => {
          return cell.name.trim() == inputHandler.dataObject.name.trim() && cell.visibleTo == sourceParent.id;
        });
        let messageFlow = messageFlowHandler.messageFlow;
        let messageFlowType = "MF-V";
        if (this.messageFlowHasStereotype(messageFlow, "SecureChannel") || this.messageFlowHasStereotype(messageFlow, "CommunicationProtection")) {
          messageFlowType = "S";
        }
        for (let inputObject of inputObjects) {
          let visibilityStatuses = [];
          if (messageFlowType == "S") {
            visibilityStatuses.push(messageFlowType);
          } else {
            if (inputObject.visibility == "H") {
              visibilityStatuses.push("MF-H");
            } else {
              visibilityStatuses.push("MF-V");
            }
          }
          let messageFlowAlreadyInList = messageFlowObjects.filter((obj) => {
            return obj.dataObject == inputObject.name;
          });
          if (messageFlowAlreadyInList.length === 0) {
            messageFlowObjects.push({ dataObject: inputObject.name, types: visibilityStatuses });
          } else {
            if (messageFlowAlreadyInList.length === 1) {
              messageFlowAlreadyInList[0].types = this.validationHandler.getUniqueValuesOfArray(messageFlowAlreadyInList[0].types.concat(visibilityStatuses));
            }
          }

        }
      }
    }
    return messageFlowObjects;
  }

  // Check if task has a stereotype (by stereotype name)
  public messageFlowHasStereotype(messageFlow: any, stereotype: string): boolean {
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

}