import * as Viewer from 'bpmn-js/lib/NavigatedViewer';
import { ValidationHandler, ValidationErrorObject } from '../handler/validation-handler';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);

declare function require(name: string);
let config = require('../../../config.json');

export class Stereotype {

  constructor(title: string, elementHandler: any) {
    this.viewer = elementHandler.viewer;
    this.registry = this.viewer.get('elementRegistry');
    this.eventBus = this.viewer.get('eventBus');
    this.canvas = this.viewer.get('canvas');
    this.overlays = this.viewer.get('overlays');

    this.elementHandler = elementHandler;
    this.validationHandler = elementHandler.validationHandler;

    this.title = title;
    this.settingsPanelContainer = $('#' + this.title + '-stereotype-options');
  }

  viewer: Viewer;
  registry: any;
  eventBus: any;
  canvas: any;
  overlays: any;

  elementHandler: any;
  validationHandler: ValidationHandler;

  title: string;
  label: string;
  settingsPanelContainer: any;
  isTempStereotype: boolean = false;

  /** Functions for all subclasses */
  getTitle() {
    return this.title;
  }

  setLabel(label: string) {
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
      this.markReadonlyFields();
    } else {
      $('#stereotype-options').prepend($('<div>').load(config.frontend.host + '/' + config.pe_bpmn_editor.folder + '/src/app/editor/stereotype/templates/' + this.getTitle() + '.html', () => {
        this.initStereotypeSettings();
        this.markReadonlyFields();
      }));
    }
  }

  // Activated by elementHandler on click events (or manually)
  loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight() {
    if ($('#stereotype-options').has('#' + this.getTitle() + '-stereotype-options').length) {
      this.initStereotypeSettings();
      this.bringSettingsPanelToTopAndHighlight();
      this.markReadonlyFields();
    } else {
      $('#stereotype-options').prepend($('<div>').load(config.frontend.host + '/' + config.pe_bpmn_editor.folder + '/src/app/editor/stereotype/templates/' + this.getTitle() + '.html', () => {
        this.initStereotypeSettings();
        this.bringSettingsPanelToTopAndHighlight();
        this.markReadonlyFields();
      }));
    }
  }

  // Activated by elementHandler on click events (or manually)
  initStereotypePublicView() { }

  // Activated by elementHandler on click events (or manually)
  initStereotypeSettings() {
    this.settingsPanelContainer = $('#' + this.getTitle() + '-stereotype-options');
    this.initRemoveButton();
  }

  markReadonlyFields() {
    if (!this.elementHandler.elementsHandler.canEdit) {
      this.settingsPanelContainer.find('[data-readonly]').each(function () {
        const type = $(this).data('readonly');
        if (type === 'hidden') {
          $(this).remove();
        } else if (type === 'disabled') {
          $(this).find(':input').attr('disabled', 'disabled');
        }
      });
    }
  }

  // Activated by elementHandler on click events (or manually)
  bringSettingsPanelToTopAndHighlight() {
    let currentPanel = this.getSettingsPanelContainer();
    currentPanel.detach();
    $('#stereotype-options').prepend(currentPanel);
    $('#sidebar').scrollTop(0);
    currentPanel.addClass('highlight');
    setTimeout(function () { currentPanel.removeClass('highlight'); }, 1000);
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
    this.terminateRemoveButton();
  }

  terminateTempStereotypeSettings() {
    let container = $('#stereotype-options');
    this.terminateRemoveButton();
    container.find('#' + this.getTitle() + '-stereotype-options').remove();
    this.elementHandler.tempStereotype = null;
  }

  saveStereotypeSettings() { }

  removeStereotype() {
    this.terminateStereotypeEditProcess();
    this.removeStereotypeFromElement();
    this.setNewModelContentVariableContent();
  }

  initRemoveButton() {
    this.terminateRemoveButton();
    if (this.elementHandler.elementsHandler.canEdit) {
      this.settingsPanelContainer.one('click', '#' + this.getTitle() + '-remove-button', (e) => {
        if (this.isTempStereotype && this.elementHandler.stereotypes.length > 0) {
          this.terminateTempStereotypeSettings();
        } else if (this.elementHandler.stereotypes.length == 0) {
          this.terminateStereotypeEditProcess();
        } else {
          this.removeStereotype();
        }
      });
    } else {
      this.settingsPanelContainer.find('#' + this.getTitle() + '-remove-button').remove();
    }
  }

  terminateRemoveButton() {
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

  checkForErrors(existingErrors: ValidationErrorObject[]) { }

  getCurrentStereotypeSettings() { };

  getSavedStereotypeSettings() { };

  areThereUnsavedChanges() {
    let currentSettings = JSON.stringify(this.getCurrentStereotypeSettings());
    let savedSettings = JSON.stringify(this.getSavedStereotypeSettings());
    if (currentSettings !== savedSettings) {
      return true;
    }
    return false;
  }

  /** Wrappers to access elementHandler functions */
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

  updateModelContentVariable(xml: string) {
    this.elementHandler.updateModelContentVariable(xml);
  }

  /** Wrappers to access validationHandler functions */
  addUniqueErrorToErrorsList(errors: ValidationErrorObject[], error: string, ids: string[], highlight: string[]) {
    this.validationHandler.addUniqueErrorToErrorsList(errors, error, ids, highlight);
  }

}