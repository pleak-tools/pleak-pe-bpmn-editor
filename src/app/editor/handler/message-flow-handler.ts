import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./elements-handler";
import { ValidationHandler } from "./validation-handler";
import { MessageFlowStereotype } from "../stereotype/message-flow-stereotype";
import { SecureChannel } from "../stereotype/stereotypes/SecureChannel";
import { CommunicationProtection } from "../stereotype/stereotypes/CommunicationProtection";

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

export class MessageFlowHandler {

  constructor(elementsHandler: ElementsHandler, messageFlow: any) {
    this.viewer = elementsHandler.viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.canvas = this.viewer.get('canvas');
    this.overlays = this.viewer.get('overlays');

    this.elementsHandler = elementsHandler;
    this.validationHandler = elementsHandler.validationHandler;
    this.messageFlow = messageFlow;

    this.init();
  }

  beingEdited: Boolean = false;

  viewer: Viewer;
  registry: any;
  canvas: any;
  overlays: any;

  validationHandler: ValidationHandler;
  elementsHandler: ElementsHandler;
  messageFlow: any;

  stereotypes: MessageFlowStereotype[] = [];
  stereotypeSelector: String = null;
  stereotypeSelectorHidden: Boolean = false;
  tempStereotype: MessageFlowStereotype = null;

  supportedStereotypes: String[] = [
    "SecureChannel",
    "CommunicationProtection"
  ];

  getMessageFlowId() {
    return this.messageFlow.id;
  }

  getName() {
    return this.messageFlow.name;
  }

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
    this.initStereotypeSettingsPanel();
    this.canvas.addMarker(this.messageFlow.id, 'selected');
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

  // End messageFlow editing (stereotype adding) process
  terminateStereotypeEditProcess() {
    this.terminateMessageFlowStereotypeSelector();
    this.terminateMessageFlowStereotypeSettings();
    this.terminateStereotypeSettingsPanel();
    this.canvas.removeMarker(this.messageFlow.id, 'selected');
    this.beingEdited = false;
    this.stereotypeSelectorHidden = false;
  }

  // Init settings panels for all already added stereotypes
  initElementStereotypeSettings() {
    for (let sType of this.stereotypes) {
      sType.isTempStereotype = false;
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

  areThereUnsavedMessageFlowChanges() {
    if (this.tempStereotype == null) {
      for (let stereotype of this.stereotypes) {
        if (stereotype.areThereUnsavedChanges()) {
          return true;
        }
      }
      return false;
    } else {
      return true;
    }
  }

  checkForUnsavedChanges() {
    if (this.areThereUnsavedMessageFlowChanges()) {
      if (confirm('Are you sure you wish to revert unsaved stereotype settings?')) {
        this.terminateStereotypeEditProcess();
      } else {
        this.canvas.addMarker(this.messageFlow.id, 'selected');
        return false;
      }
    }
    this.terminateStereotypeEditProcess();
  }

  // Show stereotype selector next to messageFlow element on the model
  initMessageFlowStereotypeSelector() {
    let overlayHtml = `
    <div class="panel panel-default stereotype-editor" id="` + this.messageFlow.id + `-stereotype-selector">
      <div class="stereotype-editor-close-link" style="float: right; color: darkgray; cursor: pointer">X</div>
      <div class="stereotype-selector-main-menu">
        <div style="margin-bottom:10px;">
          <b>Stereotypes menu</b>
        </div>
        <table class="table table-hover stereotypes-table">
          <tbody>
            <tr>
              <td class="link-row" id="SecureChannel-button">SecureChannel</td>
            </tr>
            <tr>
            <td class="link-row" id="CommunicationProtection-button">CommunicationProtection</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    `;

    overlayHtml = $(overlayHtml);

    $(overlayHtml).on('click', '.stereotype-editor-close-link', (e) => {
      this.terminateMessageFlowStereotypeSelector();
      this.beingEdited = false;
      this.stereotypeSelectorHidden = true;
    });

    // Stereotype links
    for (let stereotype of this.supportedStereotypes) {
      $(overlayHtml).on('click', '#' + stereotype + '-button', (e) => {
        this.addStereotypeByName(stereotype);
      });

      if (this.messageFlow[(<any>stereotype)] != null) {
        $(overlayHtml).find('#' + stereotype + '-button').addClass('disabled-link');
      }

    }

    let stOverlay = this.overlays.add(this.registry.get(this.messageFlow.id), {
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
      } else if (name == "CommunicationProtection") {
        st = new CommunicationProtection(this);
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
      let st = this.createStereotypeByName(name);
      st.isTempStereotype = true;
      st.loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight();
      this.tempStereotype = st;
    } else {
      if (this.tempStereotype.getTitle() != name) {
        this.tempStereotype.terminateStereotypeSettings();
        this.initElementStereotypeSettings();
        let st = this.createStereotypeByName(name);
        st.isTempStereotype = true;
        st.loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight();
        this.tempStereotype = st;
      }
    }
    this.initStereotypeSettingsPanel();
  }

  // Add new stereotype to the messageFlow (save)
  addTempStereotypeToElement() {
    this.addStereotypeToMessageFlow(this.tempStereotype);
    this.addStereotypeLabelToElement(this.tempStereotype.getTitle());
  }

  // Remove stereotype from the messageFlow by stereotype name
  removeStereotypeByName(name: String) {
    if (this.getMessageFlowStereotypeInstanceByName(name)) {
      this.overlays.remove({id: this.getMessageFlowStereotypeInstanceByName(name).getLabel()});
      this.stereotypes = this.stereotypes.filter(obj => obj.getTitle() !== name);
      this.canvas.removeMarker(this.messageFlow.id, 'selected');
      delete this.messageFlow[(<any>name)];
    }
  }

  // Get stereotype instance of the messageFlow by stereotype name
  getMessageFlowStereotypeInstanceByName(name: String) {
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
           <span class="stereotype-label-color" style="font-size:12px;"><b>` + title + `</b></span>
         </div>`
      );
      let stLabel = this.overlays.add(this.registry.get(this.messageFlow.id), {
        position: {
          top: 15,
          right: 0
        },
        show: {
          minZoom: 0,
          maxZoom: 5.0
        },
        html: messageFlowTypeLabel
      });
      this.getMessageFlowStereotypeInstanceByName(title).setLabel(stLabel);
    }
  }

  // Get all input elements of the messageFlow
  getMessageFlowInputObjects() {
    let objects = [];
    if (this.messageFlow.id && this.messageFlow.sourceRef.dataInputAssociations) {
      for (let inputAssociation of this.messageFlow.sourceRef.dataInputAssociations) {
        if (inputAssociation && inputAssociation.sourceRef) {
          for (let inputData of inputAssociation.sourceRef) {
            if (inputData.$type === "bpmn:DataObjectReference" || inputData.$type === "bpmn:DataStoreReference") {
              objects.push(this.registry.get(inputData.id));
            }
          }
        }
      }
    }
    return objects;
  }

  // Get all output elements of the messageFlow
  getMessageFlowOutputObjects() {
    let objects = [];
    if (this.messageFlow.id && this.messageFlow.targetRef.dataOutputAssociations) {
      for (let outputAssociation of this.messageFlow.targetRef.dataOutputAssociations) {
        if (outputAssociation.targetRef && outputAssociation.targetRef.length > 1) {
          for (let outputData of outputAssociation.targetRef) {
            if (outputData.$type === "bpmn:DataObjectReference" || outputData.$type === "bpmn:DataStoreReference") {
              objects.push(this.registry.get(outputData.id));
            }
          }
        } else {
          if (outputAssociation.targetRef && (outputAssociation.targetRef.$type === "bpmn:DataObjectReference" || outputAssociation.targetRef.$type === "bpmn:DataStoreReference")) {
            objects.push(this.registry.get(outputAssociation.targetRef.id));
          }
        }
      }
    }
    return objects;
  }

  // Return all task stereotype instances
  getAllMessageFlowStereotypeInstances() {
    return this.stereotypes;
  }


  /** Wrappers to access elementsHandler functions*/

  getMessageFlowHandlerByMessageFlowId(messageFlowId: String) {
    return this.elementsHandler.getMessageFlowHandlerByMessageFlowId(messageFlowId);
  }

  getAllModelMessageFlowHandlers() {
    return this.elementsHandler.getAllModelMessageFlowHandlers();
  }

  updateModelContentVariable(xml: string) {
    this.elementsHandler.updateModelContentVariable(xml);
  }

  initStereotypeSettingsPanel() {
    this.elementsHandler.initStereotypeSettingsPanel(this);
  }

  terminateStereotypeSettingsPanel() {
    this.elementsHandler.terminateStereotypeSettingsPanel();
  }

}