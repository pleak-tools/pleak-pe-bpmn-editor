import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

declare var $: any;
let is = (element, type) => element.$instanceOf(type);

declare function require(name:string);
var config = require('../../../config.json');

export class Stereotype {

  constructor(title: String, elementHandler: any) {
    this.viewer = elementHandler.viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.eventBus = this.viewer.get('eventBus');
    this.canvas = this.viewer.get('canvas');
    this.overlays = this.viewer.get('overlays');

    this.elementHandler = elementHandler;

    this.title = title;
    this.settingsPanelContainer = $('#' + this.title + '-stereotype-options');
  }

  viewer: Viewer;
  registry: any;
  eventBus: any;
  canvas: any;
  overlays: any;

  elementHandler: any;

  title: String;
  label: String;
  settingsPanelContainer: any;

  /** Functions for all subclasses */
  getTitle() {
    return this.title;
  }

  setLabel(label: String) {
    this.label = label;
  }

  getLabel() {
    return this.label;
  }

  getSettingsPanelContainer() {
    return this.settingsPanelContainer;
  }

  // Activated by elementHandler on click events (or manually)
  loadStereotypeTemplateAndInitStereotypeSettings() {
    if ($('#stereotype-options').has('#' + this.getTitle() + '-stereotype-options').length) {
      this.initStereotypeSettings();
    } else {
      $('#stereotype-options').prepend($('<div>').load(config.frontend.host + '/' + config.pe_bpmn_editor.folder + '/src/app/editor/stereotype/templates/' + this.getTitle() + '.html', () => {
        this.initStereotypeSettings();
      }));
    }
  }

  // Activated by elementHandler on click events (or manually)
  loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight() {
    if ($('#stereotype-options').has('#' + this.getTitle() + '-stereotype-options').length) {
      this.initStereotypeSettings();
      this.bringSettingsPanelToTopAndHighlight();
    } else {
      $('#stereotype-options').prepend($('<div>').load(config.frontend.host + '/' + config.pe_bpmn_editor.folder + '/src/app/editor/stereotype/templates/' + this.getTitle() + '.html', () => {
        this.initStereotypeSettings();
        this.bringSettingsPanelToTopAndHighlight();
      }));
    }
  }

  // Activated by elementHandler on click events (or manually)
  initStereotypePublicView() {}

  // Activated by elementHandler on click events (or manually)
  initStereotypeSettings() {
    this.settingsPanelContainer = $('#' + this.getTitle() + '-stereotype-options');
    this.initSaveAndRemoveButtons();
  }

  // Activated by elementHandler on click events (or manually)
  bringSettingsPanelToTopAndHighlight() {
    let currentPanel = this.getSettingsPanelContainer();
    currentPanel.detach();
    $('#stereotype-options').prepend(currentPanel);
    $('#sidebar').scrollTop(0);
    currentPanel.addClass('highlight');
    setTimeout(function() { currentPanel.removeClass('highlight'); },1000);
  }

  // Activated by elementHandler on click events (or manually)
  terminateStereotypeSettings() {
    let container = $('#stereotype-options');
    container.find('.stereotype-option').html('');
    container.find('.stereotype-option').val('');
    container.find('.form-group').removeClass('has-error');
    container.find('.help-block').hide();
    container.find('.stereotype-options-panel').hide();
    if (container.hasClass('stereotype-options-panel')) {
      container.hide();
    }
    this.terminateSaveAndRemoveButtons();
  }

  saveStereotypeSettings() {
    this.terminateStereotypeEditProcess();
    this.setNewModelContentVariableContent();
  }
  
  removeStereotype() {
    this.terminateStereotypeEditProcess();
    this.removeStereotypeFromElement();
    this.setNewModelContentVariableContent();
  }

  initSaveAndRemoveButtons() {
    this.settingsPanelContainer.one('click', '#' + this.getTitle() + '-save-button', (e) => {
      this.saveStereotypeSettings();
    });
    this.settingsPanelContainer.one('click', '#' + this.getTitle() + '-remove-button', (e) => {
      this.removeStereotype();
    });
  }

  terminateSaveAndRemoveButtons() {
    this.settingsPanelContainer.off('click', '#' + this.getTitle() + '-save-button');
    this.settingsPanelContainer.off('click', '#' + this.getTitle() + '-remove-button');
  }

  setNewModelContentVariableContent() {
    this.viewer.saveXML(
      {
        format: true
      },
      (err: any, xml: string) => {
        this.updateModelContentVariable(xml);
      }
    );
  }

  /** Wrappers to access elementHandler functions*/
  addStereotypeToElement() {
    this.elementHandler.addTempStereotypeToElement();
  }

  removeStereotypeFromElement() {
    this.elementHandler.removeStereotypeByName(this.getTitle());
  }

  initAllElementStereotypesSettings() {
    this.elementHandler.initElementStereotypeSettings();
  }

  terminateStereotypeEditProcess() {
    this.elementHandler.terminateStereotypeEditProcess();
  }

  updateModelContentVariable(xml: String) {
    return this.elementHandler.updateModelContentVariable(xml);
  }

}