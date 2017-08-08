import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { MessageFlowStereotype } from "../stereotype/message-flow-stereotype";
import { SecureChannel } from "../stereotype/stereotypes/SecureChannel";

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

export class MessageFlowHandler {

  constructor(elementsHandler: ElementsHandler, messageFlow: any) {
    this.viewer = elementsHandler.viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.canvas = this.viewer.get('canvas');
    this.overlays = this.viewer.get('overlays');

    this.elementsHandler = elementsHandler;
    this.messageFlow = messageFlow;

    this.init();
  }

  beingEdited: Boolean = false;

  viewer: Viewer;
  registry: any;
  canvas: any;
  overlays: any;

  elementsHandler: ElementsHandler;
  messageFlow: any;

  stereotypes: MessageFlowStereotype[] = [];
  stereotypeSelector: String = null;
  tempStereotype: MessageFlowStereotype = null;

  supportedStereotypes: String[] = [
    "SecureChannel"
  ];

  init() {
    // Add stereotype instances to the messageFlow (based on xml of the model)
    for (let sType of this.supportedStereotypes) {
      if (this.messageFlow[(<any>sType)] != null) {
        let stInstance = this.createStereotypeByName(sType);
        this.addStereotypeToMessageFlow(stInstance);
      }
    }
    this.loadMessageFlowStereotypes();
  }

  // Add already existing stereotype labels to the model
  loadMessageFlowStereotypes() {
    if (this.stereotypes.length > 0) {
      for (let stereotype of this.stereotypes) {
        this.addStereotypeLabelToElement(stereotype.getTitle());
      }
    }
  }

  // Start messageFlow editing (stereotype adding) process
  initStereotypeEditProcess() {
    if (this.stereotypeSelector == null) {
      this.initMessageFlowStereotypeSelector();
    }
    this.initElementStereotypeSettings();
    this.beingEdited = true;
  }

  // End messageFlow editing (stereotype adding) process
  terminateStereotypeEditProcess() {
    this.terminateMessageFlowStereotypeSelector();
    this.terminateMessageFlowStereotypeSettings();
    this.beingEdited = false;
  }

  // Init settings panels for all already added stereotypes
  initElementStereotypeSettings() {
    for (let sType of this.stereotypes) {
      sType.loadStereotypeTemplateAndInitStereotypeSettings();
    }
  }
  
  // Hide settings panels for all already added stereotypes
  terminateMessageFlowStereotypeSettings() {
    for (let sType of this.stereotypes) {
      sType.terminateStereotypeSettings();
    }
    if (this.tempStereotype != null) {
      this.tempStereotype.terminateStereotypeSettings();
      this.tempStereotype = null;
    }
  }

  // Show stereotype selector next to messageFlow element on the model
  initMessageFlowStereotypeSelector() {
    var overlayHtml = 
      `<div class="stereotype-editor" id="` + this.messageFlow.id + `-stereotype-selector" style="background:white; padding:10px; border-radius:2px">
        <span><b>Select type:</b></span>`;
    for (let stereotype of this.supportedStereotypes) {
      let disabled = "";
      if (this.messageFlow[(<any>stereotype)] != null) {
        disabled = `disabled style="opacity:0.5"`;
      }
      overlayHtml += `<button id="` + this.messageFlow.id + `-` + stereotype + `-button" ` + disabled + `>` + stereotype + `</button><br>`;
    }
    overlayHtml += `</div>`;

    overlayHtml = $(overlayHtml);

    for (let stereotype of this.supportedStereotypes) {
      $(overlayHtml).on('click', '#' + this.messageFlow.id+'-' + stereotype + '-button', (e) => {
        this.addStereotypeByName(stereotype);
      });
    }

    var stOverlay = this.overlays.add(this.registry.get(this.messageFlow.id), {
      position: {
        bottom: 0,
        right: 0
      },
      html: overlayHtml
    });
    this.stereotypeSelector = stOverlay;
  }

  // Remove stereotype selector
  terminateMessageFlowStereotypeSelector() {
    this.overlays.remove({id: this.stereotypeSelector});
    this.stereotypeSelector = null;
  }

  // Create and return new stereotype instance by name
  createStereotypeByName(name: String) {
    let st = null;
    if (name) {
      if (name == "SecureChannel") {
        st = new SecureChannel(this);
      }
    }
    return st;
  }

  // Add stereotype instance to the messageFlow
  addStereotypeToMessageFlow(stereotype: MessageFlowStereotype) {
    this.stereotypes.push(stereotype);
  }

  // Start adding new stereotype to the messageFlow (open settings panel etc)
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

  // Add new stereotype to the messageFlow (save)
  addTempStereotypeToElement() {
    this.addStereotypeToMessageFlow(this.tempStereotype);
    this.addStereotypeLabelToElement(this.tempStereotype.getTitle());
  }

  // Remove stereotype from the messageFlow by stereotype name
  removeStereotypeByName(name: String) {
    if (this.getAddedStereotypeInstanceByName(name)) {
      this.overlays.remove({id: this.getAddedStereotypeInstanceByName(name).getLabel()});
      this.stereotypes = this.stereotypes.filter(obj => obj.getTitle() !== name);
      delete this.messageFlow[(<any>name)];
    }
  }

  // Get stereotype instance of the messageFlow by stereotype name
  getAddedStereotypeInstanceByName(name: String) {
    for (let sType of this.stereotypes) {
      if (sType.getTitle() == name) {
        return sType;
      }
    }
  }

  // Add stereotype label to the messageFlow by stereotype name
  addStereotypeLabelToElement(title: String) {
    if (title != null) {
      let messageFlowTypeLabel = $(
        `<div class="stereotype-label" id="` + this.messageFlow.id + `-` + title + `-label" style="padding:5px; border-radius:2px">
           <span style="font-size:12px; color:darkblue"><b>` + title + `</b></span>
         </div>`
      );
      let stLabel = this.overlays.add(this.registry.get(this.messageFlow.id), {
        position: {
          top: 15,
          right: 0
        },
        html: messageFlowTypeLabel
      });
      this.getAddedStereotypeInstanceByName(title).setLabel(stLabel);
    }
  }


  /** Wrappers to access elementsHandler functions*/

  // Get messageFlowHandler instance of messageFlow by messageFlow id
  getMessageFlowHandlerByMessageFlowId(messageFlowId: String) {
    return this.elementsHandler.getMessageFlowHandlerByMessageFlowId(messageFlowId);
  }

  // Get all messageFlowHandler instances of the model
  getAllModelMessageFlowHandlers() {
    return this.elementsHandler.getAllModelMessageFlowHandlers();
  }

  updateModelContentVariable(xml: String) {
    this.elementsHandler.updateModelContentVariable(xml);
  }

}