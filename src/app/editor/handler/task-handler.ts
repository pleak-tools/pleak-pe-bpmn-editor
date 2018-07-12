import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler, ValidationErrorObject } from "./validation-handler";
import { TaskStereotype } from "../stereotype/task-stereotype";
import { PKEncrypt } from "../stereotype/stereotypes/PKEncrypt";
import { PKDecrypt } from "../stereotype/stereotypes/PKDecrypt";
import { PKComputation } from "../stereotype/stereotypes/PKComputation";
import { MPC } from "../stereotype/stereotypes/MPC";
import { SKEncrypt } from "../stereotype/stereotypes/SKEncrypt";
import { SKDecrypt } from "../stereotype/stereotypes/SKDecrypt";
import { SKComputation } from "../stereotype/stereotypes/SKComputation";
import { SSSharing } from "../stereotype/stereotypes/SSSharing";
import { SSComputation } from "../stereotype/stereotypes/SSComputation";
import { SSReconstruction } from "../stereotype/stereotypes/SSReconstruction";
import { AddSSSharing } from "../stereotype/stereotypes/AddSSSharing";
import { AddSSComputation } from "../stereotype/stereotypes/AddSSComputation";
import { AddSSReconstruction } from "../stereotype/stereotypes/AddSSReconstruction";
import { FunSSSharing } from "../stereotype/stereotypes/FunSSSharing";
import { FunSSComputation } from "../stereotype/stereotypes/FunSSComputation";
import { FunSSReconstruction } from "../stereotype/stereotypes/FunSSReconstruction";
import { SGXComputation } from "../stereotype/stereotypes/SGXComputation";
import { SGXProtect } from "../stereotype/stereotypes/SGXProtect";
import { SGXQuoting } from "../stereotype/stereotypes/SGXQuoting";
import { SGXQuoteVerification } from "../stereotype/stereotypes/SGXQuoteVerification";
import { SGXAttestationEnclave } from "../stereotype/stereotypes/SGXAttestationEnclave";
import { SGXAttestationChallenge } from "../stereotype/stereotypes/SGXAttestationChallenge";
import { DimensionalityReduction } from "../stereotype/stereotypes/DimensionalityReduction";
import { GCGarble } from "../stereotype/stereotypes/GCGarble";
import { GCEvaluate } from "../stereotype/stereotypes/GCEvaluate";
import { GCComputation } from "../stereotype/stereotypes/GCComputation";
import { OTSend } from "../stereotype/stereotypes/OTSend";
import { OTReceive } from "../stereotype/stereotypes/OTReceive";
import { DifferentialPrivacy } from "../stereotype/stereotypes/DifferentialPrivacy";
import { ProtectConfidentiality } from "../stereotype/stereotypes/ProtectConfidentiality";
import { OpenConfidentiality } from "../stereotype/stereotypes/OpenConfidentiality";
import { PETComputation } from "../stereotype/stereotypes/PETComputation";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class TaskHandler {

  constructor(elementsHandler: ElementsHandler, task: any) {
    this.viewer = elementsHandler.viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.canvas = this.viewer.get('canvas');
    this.overlays = this.viewer.get('overlays');

    this.elementsHandler = elementsHandler;
    this.validationHandler = elementsHandler.validationHandler;
    this.task = task;

    this.init();
  }

  beingEdited: Boolean = false;

  viewer: Viewer;
  registry: any;
  canvas: any;
  overlays: any;

  elementsHandler: ElementsHandler;
  validationHandler: ValidationHandler;
  task: any;

  stereotypes: TaskStereotype[] = [];
  stereotypeSelector: String = null;
  stereotypeSelectorHidden: Boolean = false;
  tempStereotype: TaskStereotype = null;

  supportedStereotypes: String[] = [
    "PKEncrypt",
    "PKDecrypt",
    "PKComputation",
    "MPC",
    "SKEncrypt",
    "SKDecrypt",
    "SKComputation",
    "SSSharing",
    "SSComputation",
    "SSReconstruction",
    "AddSSSharing",
    "AddSSComputation",
    "AddSSReconstruction",
    "FunSSSharing",
    "FunSSComputation",
    "FunSSReconstruction",
    "SGXComputation",
    "SGXProtect",
    "SGXAttestationEnclave",
    "SGXAttestationChallenge",
    "SGXQuoting",
    "SGXQuoteVerification",
    "DimensionalityReduction",
    "GCGarble",
    "GCEvaluate",
    "GCComputation",
    "OTSend",
    "OTReceive",
    "DifferentialPrivacy",
    "ProtectConfidentiality",
    "OpenConfidentiality",
    "PETComputation"
  ];

  getTaskId() {
    return this.task.id;
  }

  init() {
    // Add stereotype instances to the task (based on xml of the model)
    for (let sType of this.supportedStereotypes) {
      if (this.task[(<any>sType)] != null) {
        let stInstance = this.createStereotypeByName(sType);
        this.addStereotypeToTask(stInstance);
      }
    }
    this.loadTaskStereotypes();
    this.loadTaskLaneOrPool();
  }

  getDataObjectVisibilityStatus(dataObjectId: String) {
    let allStatuses = [];
    for (let sType of this.getAllTaskStereotypeInstances()) {
      let statuses = sType.getDataObjectVisibilityStatus(dataObjectId);
      if (statuses) {
        allStatuses = allStatuses.concat(statuses);
      }
    }
    return allStatuses;
  }

  // Add already existing stereotype labels to the model
  loadTaskStereotypes() {
    if (this.stereotypes.length > 0) {
      for (let stereotype of this.stereotypes) {
        this.addStereotypeLabelToElement(stereotype.getTitle());
      }
    }
  }

  // Load information about tasks' parent lane/pool
  loadTaskLaneOrPool() {
    let task = this.registry.get(this.task.id);
    if (task.businessObject.lanes) {
      this.addLaneOrPoolToTheListOfModelLanesAndPools(task.businessObject.lanes[0].id);
      this.loadTaskOntoParentLaneOrPool(task.businessObject.lanes[0].id, this.task.id);
    }
    if (!task.businessObject.lanes) {
      this.addLaneOrPoolToTheListOfModelLanesAndPools(task.parent.id);
      this.loadTaskOntoParentLaneOrPool(task.parent.id, this.task.id);
    }
  }

  // Start task editing (stereotype adding) process
  initStereotypeEditProcess() {
    if (this.stereotypeSelector == null) {
      this.initTaskStereotypeSelector();
    }
    this.initElementStereotypeSettings();
    this.beingEdited = true;
  }

  // Start stereotype public view for the viewer
  initPublicStereotypeView() {
    for (let sType of this.stereotypes) {
      sType.initStereotypePublicView();
    }
    this.initElementStereotypeSettings();
    this.beingEdited = false;
    this.stereotypeSelectorHidden = true;
    this.stereotypeSelector = null;
  }

  // End task editing (stereotype adding) process
  terminateStereotypeEditProcess() {
    this.terminateTaskStereotypeSelector();
    this.terminateTaskStereotypeSettings();
    this.beingEdited = false;
    this.stereotypeSelectorHidden = false;
  }

  // Init settings panels for all already added stereotypes
  initElementStereotypeSettings() {
    for (let sType of this.stereotypes) {
      sType.loadStereotypeTemplateAndInitStereotypeSettings();
    }
  }
  
  // Hide settings panels for all already added stereotypes
  terminateTaskStereotypeSettings() {
    for (let sType of this.stereotypes) {
      sType.terminateStereotypeSettings();
    }
    if (this.tempStereotype != null) {
      this.tempStereotype.terminateStereotypeSettings();
      this.tempStereotype = null;
    }
  }

  // Show stereotype selector next to task element on the model
  initTaskStereotypeSelector() {

    let overlayHtml = `
      <div class="panel panel-default stereotype-editor" id="` + this.task.id + `-stereotype-selector">
        <div class="stereotype-editor-close-link" style="float: right; color: darkgray; cursor: pointer">X</div>
        <div id="stereotype-selector-main-menu">
          <div style="margin-bottom:10px;">
            <span><b>Stereotypes main menu</b></span>
          </div>
          <table class="table table-hover">
            <tbody>
              <tr id="data-protection-menu-link">
                <td class="link-row"><span>Data Protection</span></td>
              </tr>
              <tr id="data-processing-menu-link">
                <td class="link-row"><span>Data Processing</span></td>
              </tr>
              <tr id="entity-authentication-menu-link">
                <td class="link-row"><span>Entity Authentication</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="stereotype-menu" id="data-protection-menu">
          <div style="margin-bottom:10px;">
            <span class="back-main-menu-link link-row">Stereotypes main menu</span> > <b>Data protection</b>
          </div>
          <table class="table table-hover">
            <tbody>
              <tr id="data-protection-integrity-menu-link">
                <td class="link-row"><span>Integrity protection</span></td>
              </tr>
              <tr id="data-protection-confidentiality-menu-link">
                <td class="link-row"><span>Confidentiality protection</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="stereotype-submenu" id="data-protection-integrity-menu">
          <span class="back-main-menu-link link-row">Stereotypes main menu</span> > <span class="back-data-protection-menu-link link-row">Data protection</span> > <b>Integrity protection</b>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>Protect</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row SGXQuoting-button">SGXQuoting</td>
              </tr>
            </tbody>
          <table>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row SGXQuoteVerification-button">SGXQuoteVerification</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="stereotype-submenu" id="data-protection-confidentiality-menu">
          <span class="back-main-menu-link link-row">Stereotypes main menu</span> > <span class="back-data-protection-menu-link link-row">Data protection</span> > <b>Confidentiality protection</b>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>Protect</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row PKEncrypt-button">PKEncrypt</td>
              </tr>
              <tr>
                <td class="link-row SKEncrypt-button">SKEncrypt</td>
              </tr>
              <tr>
                <td class="link-row SSSharing-button">SSSharing</td>
              </tr>
              <tr>
                <td class="link-row AddSSSharing-button">AddSSSharing</td>
              </tr>
              <tr>
                <td class="link-row FunSSSharing-button">FunSSSharing</td>
              </tr>
              <tr>
                <td class="link-row SGXProtect-button">SGXProtect</td>
              </tr>
              <tr>
                <td class="link-row ProtectConfidentiality-button">ProtectConfidentiality</td>
              </tr>
            </tbody>
          </table>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row PKDecrypt-button">PKDecrypt</td>
              </tr>
              <tr>
                <td class="link-row SKDecrypt-button">SKDecrypt</td>
              </tr>
              <tr>
                <td class="link-row SSReconstruction-button">SSReconstruction</td>
              </tr>
              <tr>
                <td class="link-row AddSSReconstruction-button">AddSSReconstruction</td>
              </tr>
              <tr>
                <td class="link-row FunSSReconstruction-button">FunSSReconstruction</td>
              </tr>
              <tr>
                <td class="link-row OpenConfidentiality-button">OpenConfidentiality</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="stereotype-menu" id="data-processing-menu">
          <div style="margin-bottom:10px;">
            <span class="back-main-menu-link link-row">Stereotypes main menu</span> > <b>Data processing</b>
          </div>
          <table class="table table-hover">
            <tbody>
              <tr id="data-processing-privacy-preserving-menu-link">
                <td class="link-row"><span>Privacy preserving</span></td>
              </tr>
              <tr id="data-processing-privacy-adding-menu-link">
                <td class="link-row"><span>Privacy adding</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="stereotype-submenu" id="data-processing-privacy-preserving-menu">
          <span class="back-main-menu-link link-row">Stereotypes main menu</span> > <span class="back-data-processing-menu-link link-row">Data processing</span> > <b>Privacy preserving</b>
          <table class="table table-hover stereotypes-table">
            <tbody>
              <tr>
                <td class="link-row PETComputation-button">PETComputation</td>
              </tr>
            </tbody>
          </table>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>MPC</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row MPC-button">MPC</td>
              </tr>
              <tr>
                <td class="link-row SSComputation-button">SSComputation</td>
              </tr>
              <tr>
                <td class="link-row AddSSComputation-button">AddSSComputation</td>
              </tr>
              <tr>
                <td class="link-row FunSSComputation-button">FunSSComputation</td>
              </tr>
              <tr>
                <td class="link-row GCEvaluate-button">GCEvaluate</td>
              </tr>
              <tr>
                <td class="link-row GCGarble-button">GCGarble</td>
              </tr>
              <tr>
                <td class="link-row GCComputation-button">GCComputation</td>
              </tr>
            </tbody>
          </table>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>SecureHardware</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row SGXComputation-button">SGXComputation</td>
              </tr>
            </tbody>
          </table>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>Encrypted</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row PKComputation-button">PKComputation</td>
              </tr>
              <tr>
                <td class="link-row SKComputation-button">SKComputation</td>
              </tr>
            </tbody>
          </table>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>OT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row OTSend-button">OTSend</td>
              </tr>
              <tr>
                <td class="link-row OTReceive-button">OTReceive</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="stereotype-submenu" id="data-processing-privacy-adding-menu">
          <div style="margin-bottom:10px;">
            <span class="back-main-menu-link link-row">Stereotypes main menu</span> > <span class="back-data-processing-menu-link link-row">Data processing</span> > <b>Privacy adding</b>
          </div>
          <table class="table table-hover stereotypes-table">
            <tbody>
              <tr>
                <td class="link-row DimensionalityReduction-button">DimensionalityReduction</td>
              </tr>
              <tr>
                <td class="link-row DifferentialPrivacy-button">DifferentialPrivacy</td>
              </tr>
              <tr>
                <td class="link-row PETComputation-button">PETComputation</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="stereotype-menu" id="entity-authentication-menu">
          <span class="back-main-menu-link link-row">Stereotypes main menu</span> > <b>Entity authentication</b>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>Authenticate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row SGXAttestationEnclave-button">SGXAttestationEnclave</td>
              </tr>
            </tbody>
          </table>
          <table class="table table-hover stereotypes-table">
            <thead>
              <tr>
                <th>Verify</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="link-row SGXAttestationChallenge-button">SGXAttestationChallenge</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    overlayHtml = $(overlayHtml);

    // Breadcrumb links
    $(overlayHtml).on('click', '.back-main-menu-link', (e) => {
      $(overlayHtml).find('.stereotype-menu, .stereotype-submenu').hide();
      $(overlayHtml).find('#stereotype-selector-main-menu').show();
    });

    $(overlayHtml).on('click', '.back-data-protection-menu-link', (e) => {
      $(overlayHtml).find('.stereotype-submenu').hide();
      $(overlayHtml).find('#data-protection-menu').show();
    });

    $(overlayHtml).on('click', '.back-data-processing-menu-link', (e) => {
      $(overlayHtml).find('.stereotype-submenu').hide();
      $(overlayHtml).find('#data-processing-menu').show();
    });

    // Menu links
    $(overlayHtml).on('click', '#data-protection-menu-link', (e) => {
      $(overlayHtml).find('#stereotype-selector-main-menu').hide();
      $(overlayHtml).find('#data-protection-menu').show();
    });

    $(overlayHtml).on('click', '#data-protection-integrity-menu-link', (e) => {
      $(overlayHtml).find('#data-protection-menu').hide();
      $(overlayHtml).find('#data-protection-integrity-menu').show();
    });

    $(overlayHtml).on('click', '#data-protection-confidentiality-menu-link', (e) => {
      $(overlayHtml).find('#data-protection-menu').hide();
      $(overlayHtml).find('#data-protection-confidentiality-menu').show();
    });

    $(overlayHtml).on('click', '#data-processing-menu-link', (e) => {
      $(overlayHtml).find('#stereotype-selector-main-menu').hide();
      $(overlayHtml).find('#data-processing-menu').show();
    });

    $(overlayHtml).on('click', '#data-processing-privacy-preserving-menu-link', (e) => {
      $(overlayHtml).find('#data-processing-menu').hide();
      $(overlayHtml).find('#data-processing-privacy-preserving-menu').show();
    });

    $(overlayHtml).on('click', '#data-processing-privacy-adding-menu-link', (e) => {
      $(overlayHtml).find('#data-processing-menu').hide();
      $(overlayHtml).find('#data-processing-privacy-adding-menu').show();
    });

    $(overlayHtml).on('click', '#entity-authentication-menu-link', (e) => {
      $(overlayHtml).find('#stereotype-selector-main-menu').hide();
      $(overlayHtml).find('#entity-authentication-menu').show();
    });

    // Hide stereotype selector
    $(overlayHtml).on('click', '.stereotype-editor-close-link', (e) => {
      this.terminateTaskStereotypeSelector();
      this.beingEdited = false;
      this.stereotypeSelectorHidden = true;
    });

    // Stereotype links
    for (let stereotype of this.supportedStereotypes) {
      $(overlayHtml).on('click', '.' + stereotype + '-button', (e) => {
        $(e.target).addClass('selected');
        this.addStereotypeByName(stereotype);
      });

      if (this.task[(<any>stereotype)] != null) {
        $(overlayHtml).find('.' + stereotype + '-button').addClass('disabled-link');
      }
    }

    let stOverlay = this.overlays.add(this.registry.get(this.task.id), {
      position: {
        bottom: 0,
        right: 0
      },
      show: {
        minZoom: 0,
        maxZoom: 5.0
      },
      html: overlayHtml
    });
    this.stereotypeSelector = stOverlay;
  }

  // Remove stereotype selector
  terminateTaskStereotypeSelector() {
    this.overlays.remove({id: this.stereotypeSelector});
    this.stereotypeSelector = null;
  }

  // Create and return new stereotype instance by name
  createStereotypeByName(name: String) {
    let st = null;
    if (name) {
      if (name == "PKEncrypt") {
        st = new PKEncrypt(this);
      } else if (name == "PKDecrypt") {
        st = new PKDecrypt(this);
      } else if (name == "PKComputation") {
        st = new PKComputation(this);
      } else if (name == "MPC") {
        st = new MPC(this);
      } else if (name == "SKEncrypt") {
        st = new SKEncrypt(this);
      } else if (name == "SKDecrypt") {
        st = new SKDecrypt(this);
      } else if (name == "SKComputation") {
        st = new SKComputation(this);
      } else if (name == "SSSharing") {
        st = new SSSharing(this);
      } else if (name == "SSComputation") {
        st = new SSComputation(this);
      } else if (name == "SSReconstruction") {
        st = new SSReconstruction(this);
      } else if (name == "AddSSSharing") {
        st = new AddSSSharing(this);
      } else if (name == "AddSSComputation") {
        st = new AddSSComputation(this);
      } else if (name == "AddSSReconstruction") {
        st = new AddSSReconstruction(this);
      } else if (name == "FunSSSharing") {
        st = new FunSSSharing(this);
      } else if (name == "FunSSComputation") {
        st = new FunSSComputation(this);
      } else if (name == "FunSSReconstruction") {
        st = new FunSSReconstruction(this);
      } else if (name == "SGXComputation") {
        st = new SGXComputation(this);
      } else if (name == "SGXProtect") {
        st = new SGXProtect(this);
      } else if (name == "SGXAttestationEnclave") {
        st = new SGXAttestationEnclave(this);
      } else if (name == "SGXAttestationChallenge") {
        st = new SGXAttestationChallenge(this);
      } else if (name == "SGXQuoting") {
        st = new SGXQuoting(this);
      } else if (name == "SGXQuoteVerification") {
        st = new SGXQuoteVerification(this);
      } else if (name == "DimensionalityReduction") {
        st = new DimensionalityReduction(this);
      } else if (name == "GCGarble") {
        st = new GCGarble(this);
      } else if (name == "GCEvaluate") {
        st = new GCEvaluate(this);
      } else if (name == "GCComputation") {
        st = new GCComputation(this);
      } else if (name == "OTSend") {
        st = new OTSend(this);
      } else if (name == "OTReceive") {
        st = new OTReceive(this);
      } else if (name == "DifferentialPrivacy") {
        st = new DifferentialPrivacy(this);
      } else if (name === "ProtectConfidentiality") {
        st = new ProtectConfidentiality(this);
      } else if (name === "OpenConfidentiality") {
        st = new OpenConfidentiality(this);
      } else if (name === "PETComputation") {
        st = new PETComputation(this);
      }
    }
    return st;
  }

  // Add stereotype instance to the task
  addStereotypeToTask(stereotype: TaskStereotype) {
    this.stereotypes.push(stereotype);
  }

  // Start adding new stereotype to the task (open settings panel etc)
  addStereotypeByName(name: String) {
    if (this.tempStereotype == null) {
      let st = this.createStereotypeByName(name);
      st.loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight();
      this.tempStereotype = st;
    } else {
      if (this.tempStereotype.getTitle() != name) {
        this.tempStereotype.terminateStereotypeSettings();
        this.initElementStereotypeSettings();
        let st = this.createStereotypeByName(name);
        st.loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight();
        this.tempStereotype = st;
      }
    }
  }

  // Add new stereotype to the task (save)
  addTempStereotypeToElement() {
    this.addStereotypeToTask(this.tempStereotype);
    this.addStereotypeLabelToElement(this.tempStereotype.getTitle());
  }

  // Remove stereotype from the task by stereotype name
  removeStereotypeByName(name: String) {
    if (this.getTaskStereotypeInstanceByName(name)) {
      this.overlays.remove({id: this.getTaskStereotypeInstanceByName(name).getLabel()});
      this.stereotypes = this.stereotypes.filter(obj => obj.getTitle() !== name);
      delete this.task[(<any>name)];
    }
  }

  // Return stereotype instance of the task by stereotype name
  getTaskStereotypeInstanceByName(name: String) {
    for (let sType of this.stereotypes) {
      if (sType.getTitle() == name) {
        return sType;
      }
    }
    return null;
  }

  // Add stereotype label to the task by stereotype name
  addStereotypeLabelToElement(title: String) {
    let stereotypesOnTaskNames = this.stereotypes.map(a => a.getTitle());
    let bottomPosition = 0;
    if (stereotypesOnTaskNames.length > 1) {
      bottomPosition = stereotypesOnTaskNames.indexOf(title)*-14;
    }
    if (title != null) {
      let taskTypeLabel = $(
        `<div class="stereotype-label" id="` + this.task.id + `-` + title + `-label" style="padding:5px; border-radius:2px">
           <span class="stereotype-label-color" style="font-size:12px;"><b>` + title + `</b></span>
         </div>`
      );
      let stLabel = this.overlays.add(this.registry.get(this.task.id), {
        position: {
          bottom: bottomPosition,
          left: -5
        },
        show: {
          minZoom: 0,
          maxZoom: 5.0
        },
        html: taskTypeLabel
      });
      this.getTaskStereotypeInstanceByName(title).setLabel(stLabel);
    }
  }

  // Highlight inputs and outputs of the task
  highlightTaskInputAndOutputObjects() {
    let taskInputOutputObjects = this.getTaskInputOutputObjects();
    for (let inputOutputObj of taskInputOutputObjects) {
      this.canvas.addMarker(inputOutputObj.id, 'highlight-input-output-selected');
    }
    for (let inputObject of this.getTaskInputObjects()) {
      if (taskInputOutputObjects.indexOf(inputObject) === -1) {
        this.canvas.addMarker(inputObject.id, 'highlight-input-selected');
      }
    }
    for (let outputObj of this.getTaskOutputObjects()) {
      if (taskInputOutputObjects.indexOf(outputObj) === -1) {
        this.canvas.addMarker(outputObj.id, 'highlight-output-selected');
      }
    }
  }

  // Remove highlighting of task inputs and outputs
  removeTaskInputsOutputsHighlights() {
    for (let inputOutputObj of this.getTaskInputOutputObjects()) {
      this.canvas.removeMarker(inputOutputObj.id, 'highlight-input-output-selected');
    }
    for (let inputObj of this.getTaskInputObjects()) {
      this.canvas.removeMarker(inputObj.id, 'highlight-input-selected');
    }
    for (let outputObj of this.getTaskOutputObjects()) {
      this.canvas.removeMarker(outputObj.id, 'highlight-output-selected');
    }
  }

  // Return all input elements of the task
  getTaskInputObjects() {
    let objects = [];
    if (this.task.id != null) {
      let task = this.registry.get(this.task.id).businessObject;
      if (task.dataInputAssociations) {
        for (let i = 0; i < task.dataInputAssociations.length; i++) {
          if (task.dataInputAssociations[i].sourceRef) {
            objects.push(this.registry.get(task.dataInputAssociations[i].sourceRef[0].id));
          }
        }
      }
    }
    return objects;
  }

  // Return all output elements of the task
  getTaskOutputObjects() {
    let objects = [];
    if (this.task.id != null) {
      let task = this.registry.get(this.task.id).businessObject;
      if (task.dataOutputAssociations) {
        for (let i = 0; i < task.dataOutputAssociations.length; i++) {
          if (task.dataOutputAssociations[i].targetRef) {
            objects.push(this.registry.get(task.dataOutputAssociations[i].targetRef.id));
          }
        }
      }
    }
    return objects;
  }

  // Return all elements that are inputs and outputs at the same time of the task
  getTaskInputOutputObjects() {
    let objects = [];
    if (this.task.id != null) {
      let allInputsOutputs = [];
      let allInputs = [];
      let allOutputs = [];
      for (let inputObj of this.getTaskInputObjects()) {
        allInputsOutputs.push(inputObj);
        allInputs.push(inputObj);
      }
      for (let outputObj of this.getTaskOutputObjects()) {
        allInputsOutputs.push(outputObj);
        allOutputs.push(outputObj);
      }
      for (let obj of allInputsOutputs) {
        if (allInputs.indexOf(obj) !== -1 && allOutputs.indexOf(obj) !== -1 && objects.indexOf(obj) === -1) {
           objects.push(obj);
        }
      }
    }
    return objects;
  }

  // Return all task stereotype instances
  getAllTaskStereotypeInstances() {
    return this.stereotypes;
  }


  /** Wrappers to access elementsHandler functions*/

  getTaskHandlerByTaskId(taskId: String) {
    return this.elementsHandler.getTaskHandlerByTaskId(taskId);
  }

  getAllModelTaskHandlers() {
    return this.elementsHandler.getAllModelTaskHandlers();
  }

  getMessageFlowHandlerByMessageFlowId(messageFlowId: String) {
    return this.elementsHandler.getMessageFlowHandlerByMessageFlowId(messageFlowId);
  }

  updateModelContentVariable(xml: String) {
    this.elementsHandler.updateModelContentVariable(xml);
  }

  /** Wrappers to access validationHandler functions*/

  addStereotypeToTheListOfGroupStereotypesOnModel(stereotype: String) {
    this.validationHandler.addStereotypeToTheListOfGroupStereotypesOnModel(stereotype);
  }

  addLaneOrPoolToTheListOfModelLanesAndPools(layer: String) {
    this.validationHandler.addLaneOrPoolToTheListOfModelLanesAndPools(layer);
  }

  loadTaskOntoParentLaneOrPool(parentId: String, taskId: String) {
    this.validationHandler.loadTaskOntoParentLaneOrPool(parentId, taskId);
  }

  areGroupsTasksInSameOrderOnAllPoolsAndLanes() {
    return this.validationHandler.areGroupsTasksInSameOrderOnAllPoolsAndLanes();
  }

  getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
    return this.validationHandler.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes()
  }

  getTasksOfIncomingPath() {
    return this.validationHandler.getTasksOfIncomingPathByInputElement(this.task);
  }

}
