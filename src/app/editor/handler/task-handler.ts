import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
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

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class TaskHandler {

  constructor(elementsHandler: ElementsHandler, task: any) {
    this.viewer = elementsHandler.viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.canvas = this.viewer.get('canvas');
    this.overlays = this.viewer.get('overlays');

    this.elementsHandler = elementsHandler;
    this.task = task;

    this.init();
  }

  beingEdited: Boolean = false;

  viewer: Viewer;
  registry: any;
  canvas: any;
  overlays: any;

  elementsHandler: ElementsHandler;
  task: any;

  stereotypes: TaskStereotype[] = [];
  stereotypeSelector: String = null;
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
    "FunSSReconstruction"
  ];

  init() {
    // Add stereotype instances to the task (based on xml of the model)
    for (let sType of this.supportedStereotypes) {
      if (this.task[(<any>sType)] != null) {
        let stInstance = this.createStereotypeByName(sType);
        this.addStereotypeToTask(stInstance);
      }
    }
    this.loadTaskStereotypes();
  }

  // Add already existing stereotype labels to the model
  loadTaskStereotypes() {
    if (this.stereotypes.length > 0) {
      for (let stereotype of this.stereotypes) {
        this.addStereotypeLabelToElement(stereotype.getTitle());
      }
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

  // End task editing (stereotype adding) process
  terminateStereotypeEditProcess() {
    this.terminateTaskStereotypeSelector();
    this.terminateTaskStereotypeSettings();
    this.beingEdited = false;
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
    var overlayHtml = 
      `<div class="stereotype-editor" id="` + this.task.id + `-stereotype-selector" style="background:white; padding:10px; border-radius:2px">
        <span><b>Select type:</b></span>`;
    for (let stereotype of this.supportedStereotypes) {
      let disabled = "";
      if (this.task[(<any>stereotype)] != null) {
        disabled = `disabled style="opacity:0.5"`;
      }
      overlayHtml += `<button id="` + this.task.id + `-` + stereotype + `-button" ` + disabled + `>` + stereotype + `</button><br>`;
    }
    overlayHtml += `</div>`;

    overlayHtml = $(overlayHtml);

    for (let stereotype of this.supportedStereotypes) {
      $(overlayHtml).on('click', '#' + this.task.id+'-' + stereotype + '-button', (e) => {
        this.addStereotypeByName(stereotype);
      });
    }

    var stOverlay = this.overlays.add(this.registry.get(this.task.id), {
      position: {
        bottom: 0,
        right: 0
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
      var st = this.createStereotypeByName(name);
      st.loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight();
      this.tempStereotype = st;
    } else {
      if (this.tempStereotype.getTitle() != name) {
        this.tempStereotype.terminateStereotypeSettings();
        this.initElementStereotypeSettings();
        var st = this.createStereotypeByName(name);
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
    if (this.getAddedStereotypeInstanceByName(name)) {
      this.overlays.remove({id: this.getAddedStereotypeInstanceByName(name).getLabel()});
      this.stereotypes = this.stereotypes.filter(obj => obj.getTitle() !== name);
      delete this.task[(<any>name)];
    }
  }

  // Get stereotype instance of the task by stereotype name
  getAddedStereotypeInstanceByName(name: String) {
    for (let sType of this.stereotypes) {
      if (sType.getTitle() == name) {
        return sType;
      }
    }
  }

  // Add stereotype label to the task by stereotype name
  addStereotypeLabelToElement(title: String) {
    if (title != null) {
      let taskTypeLabel = $(
        `<div class="stereotype-label" id="` + this.task.id + `-` + title + `-label" style="padding:5px; border-radius:2px">
           <span style="font-size:12px; color:darkblue"><b>` + title + `</b></span>
         </div>`
      );
      let stLabel = this.overlays.add(this.registry.get(this.task.id), {
        position: {
          bottom: 0,
          left: -5
        },
        html: taskTypeLabel
      });
      this.getAddedStereotypeInstanceByName(title).setLabel(stLabel);
    }
  }

  // Get all input elements of the task
  getTaskInputObjects() {
    let objects = [];
    if (this.task.id != null) {
      let task = this.registry.get(this.task.id).businessObject;
      if (task.dataInputAssociations) {
        for (var i = 0; i < task.dataInputAssociations.length; i++) {
          objects.push(this.registry.get(task.dataInputAssociations[i].sourceRef[0].id));
        }
      }
    }
    return objects;
  }

  // Get all output elements of the task
  getTaskOutputObjects() {
    let objects = [];
    if (this.task.id != null) {
      let task = this.registry.get(this.task.id).businessObject;
      if (task.dataOutputAssociations) {
        for (var i = 0; i < task.dataOutputAssociations.length; i++) {
          objects.push(this.registry.get(task.dataOutputAssociations[i].targetRef.id));
        }
      }
    }
    return objects;
  }

  // Get all elements that are inputs and outputs at the same time of the task
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
  

  /** Wrappers to access elementsHandler functions*/

  // Get taskHandler instance of task by task id
  getTaskHandlerByTaskId(taskId: String) {
    return this.elementsHandler.getTaskHandlerByTaskId(taskId);
  }

  // Get all taskHandler instances of the model
  getAllModelTaskHandlers() {
    return this.elementsHandler.getAllModelTaskHandlers();
  }

  updateModelContentVariable(xml: String) {
    this.elementsHandler.updateModelContentVariable(xml);
  }

}