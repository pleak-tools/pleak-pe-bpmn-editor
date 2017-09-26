import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { DataObjectStereotype } from "../stereotype/data-object-stereotype";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class DataObjectHandler {

  constructor(elementsHandler: ElementsHandler, dataObject: any) {
    this.viewer = elementsHandler.viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.canvas = this.viewer.get('canvas');
    this.overlays = this.viewer.get('overlays');

    this.elementsHandler = elementsHandler;
    this.dataObject = dataObject;

    this.init();
  }

  beingEdited: Boolean = false;

  viewer: Viewer;
  registry: any;
  canvas: any;
  overlays: any;

  elementsHandler: ElementsHandler;
  dataObject: any;

  stereotypes: DataObjectStereotype[] = [];
  stereotypeSelector: String = null;
  tempStereotype: DataObjectStereotype = null;

  supportedStereotypes: String[] = [
    // ""
  ];

  init() {
    // Add stereotype instances to the dataObject (based on xml of the model)
    for (let sType of this.supportedStereotypes) {
      if (this.dataObject[(<any>sType)] != null) {
        let stInstance = this.createStereotypeByName(sType);
        this.addStereotypeToDataObject(stInstance);
      }
    }
    this.loadDataObjectStereotypes();
  }

  // Add already existing stereotype labels to the model
  loadDataObjectStereotypes() {
    if (this.stereotypes.length > 0) {
      for (let stereotype of this.stereotypes) {
        this.addStereotypeLabelToElement(stereotype.getTitle());
      }
    }
  }

  // Start dataObject editing (stereotype adding) process
  initStereotypeEditProcess() {
    if (this.stereotypeSelector == null) {
      this.initDataObjectStereotypeSelector();
    }
    this.initElementStereotypeSettings();
    this.beingEdited = true;
  }

  // End dataObject editing (stereotype adding) process
  terminateStereotypeEditProcess() {
    this.terminateDataObjectStereotypeSelector();
    this.terminateDataObjectStereotypeSettings();
    this.beingEdited = false;
  }

  // Init settings panels for all already added stereotypes
  initElementStereotypeSettings() {
    for (let sType of this.stereotypes) {
      sType.loadStereotypeTemplateAndInitStereotypeSettings();
    }
  }
  
  // Hide settings panels for all already added stereotypes
  terminateDataObjectStereotypeSettings() {
    for (let sType of this.stereotypes) {
      sType.terminateStereotypeSettings();
    }
    if (this.tempStereotype != null) {
      this.tempStereotype.terminateStereotypeSettings();
      this.tempStereotype = null;
    }
  }

  // Show stereotype selector next to dataObject element on the model
  initDataObjectStereotypeSelector() {
    var overlayHtml = 
      `<div class="stereotype-editor" id="` + this.dataObject.id + `-stereotype-selector" style="background:white; padding:10px; border-radius:2px">
        <span><b>Select type:</b></span>`;
    for (let stereotype of this.supportedStereotypes) {
      let disabled = "";
      if (this.dataObject[(<any>stereotype)] != null) {
        disabled = `disabled style="opacity:0.5"`;
      }
      overlayHtml += `<button id="` + this.dataObject.id + `-` + stereotype + `-button" ` + disabled + `>` + stereotype + `</button><br>`;
    }
    overlayHtml += `</div>`;

    overlayHtml = $(overlayHtml);

    for (let stereotype of this.supportedStereotypes) {
      $(overlayHtml).on('click', '#' + this.dataObject.id+'-' + stereotype + '-button', (e) => {
        this.addStereotypeByName(stereotype);
      });
    }

    var stOverlay = this.overlays.add(this.registry.get(this.dataObject.id), {
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
  terminateDataObjectStereotypeSelector() {
    this.overlays.remove({id: this.stereotypeSelector});
    this.stereotypeSelector = null;
  }

  // Create and return new stereotype instance by name
  createStereotypeByName(name: String) {
    let st = null;
    if (name) {
    //   if (name == "Test") {
    //     st = new Test(this);
    //   }
    }
    return st;
  }

  // Add stereotype instance to the dataObject
  addStereotypeToDataObject(stereotype: DataObjectStereotype) {
    this.stereotypes.push(stereotype);
  }

  // Start adding new stereotype to the dataObject (open settings panel etc)
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

  // Add new stereotype to the dataObject (save)
  addTempStereotypeToElement() {
    this.addStereotypeToDataObject(this.tempStereotype);
    this.addStereotypeLabelToElement(this.tempStereotype.getTitle());
  }

  // Remove stereotype from the dataObject by stereotype name
  removeStereotypeByName(name: String) {
    if (this.getAddedStereotypeInstanceByName(name)) {
      this.overlays.remove({id: this.getAddedStereotypeInstanceByName(name).getLabel()});
      this.stereotypes = this.stereotypes.filter(obj => obj.getTitle() !== name);
      delete this.dataObject[(<any>name)];
    }
  }

  // Get stereotype instance of the dataObject by stereotype name
  getAddedStereotypeInstanceByName(name: String) {
    for (let sType of this.stereotypes) {
      if (sType.getTitle() == name) {
        return sType;
      }
    }
  }

  // Add stereotype label to the dataObject by stereotype name
  addStereotypeLabelToElement(title: String) {
    if (title != null) {
      let dataObjectTypeLabel = $(
        `<div class="stereotype-label" id="` + this.dataObject.id + `-` + title + `-label" style="padding:5px; border-radius:2px">
           <span class="stereotype-label-color" style="font-size:12px;"><b>` + title + `</b></span>
         </div>`
      );
      let stLabel = this.overlays.add(this.registry.get(this.dataObject.id), {
        position: {
          bottom: 0,
          left: -5
        },
        show: {
          minZoom: 0,
          maxZoom: 5.0
        },
        html: dataObjectTypeLabel
      });
      this.getAddedStereotypeInstanceByName(title).setLabel(stLabel);
    }
  }


  /** Wrappers to access elementsHandler functions*/

  // Get dataObjectHandler instance of dataObject by dataObject id
  getDataObjectHandlerByDataObjectId(dataObjectId: String) {
    return this.elementsHandler.getDataObjectHandlerByDataObjectId(dataObjectId);
  }

  // Get all dataObjectHandler instances of the model
  getAllModelDataObjectHandlers() {
    return this.elementsHandler.getAllModelDataObjectHandlers();
  }

  updateModelContentVariable(xml: String) {
    this.elementsHandler.updateModelContentVariable(xml);
  }

}