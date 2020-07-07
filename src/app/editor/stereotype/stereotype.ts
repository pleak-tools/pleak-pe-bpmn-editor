import * as Viewer from 'bpmn-js/lib/NavigatedViewer';
import { ValidationHandler, ValidationErrorObject } from '../handler/validation-handler';

declare let $: any;

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
  getTitle(): string {
    return this.title;
  }

  setLabel(label: string): void {
    this.label = label;
  }

  getLabel(): string {
    return this.label;
  }

  getSettingsPanelContainer(): any {
    return this.settingsPanelContainer;
  }

  // Activated by elementHandler on click events (or manually)
  loadStereotypeTemplateAndInitStereotypeSettings(): void {
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
  loadStereotypeTemplateAndInitStereotypeSettingsWithHighlight(): void {
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
  initStereotypePublicView(): void { }

  // Activated by elementHandler on click events (or manually)
  initStereotypeSettings(): void {
    this.settingsPanelContainer = $('#' + this.getTitle() + '-stereotype-options');
    this.initRemoveButton();
  }

  markReadonlyFields(): void {
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
  bringSettingsPanelToTopAndHighlight(): void {
    let currentPanel = this.getSettingsPanelContainer();
    currentPanel.detach();
    $('#stereotype-options').prepend(currentPanel);
    $('#sidebar').scrollTop(0);
    currentPanel.addClass('highlight');
    setTimeout(function () { currentPanel.removeClass('highlight'); }, 1000);
  }

  // Activated by elementHandler on click events (or manually)
  terminateStereotypeSettings(): void {
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

  terminateTempStereotypeSettings(): void {
    let container = $('#stereotype-options');
    this.terminateRemoveButton();
    container.find('#' + this.getTitle() + '-stereotype-options').remove();
    this.elementHandler.tempStereotype = null;
  }

  saveStereotypeSettings(): void { }

  removeStereotype(): void {
    this.terminateStereotypeEditProcess();
    this.removeStereotypeFromElement();
    this.setNewModelContentVariableContent();
  }

  initRemoveButton(): void {
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

  terminateRemoveButton(): void {
    this.settingsPanelContainer.off('click', '#' + this.getTitle() + '-remove-button');
  }

  setNewModelContentVariableContent(): void {
    this.viewer.saveXML(
      {
        format: true
      },
      (err: any, xml: string) => {
        this.updateModelContentVariable(xml);
      }
    );
  }

  checkForErrors(existingErrors: ValidationErrorObject[]): void { }

  getCurrentStereotypeSettings(): any { };

  getSavedStereotypeSettings(): any { };

  areThereUnsavedChanges(): boolean {
    let currentSettings = JSON.stringify(this.getCurrentStereotypeSettings());
    let savedSettings = JSON.stringify(this.getSavedStereotypeSettings());
    if (currentSettings !== savedSettings) {
      return true;
    }
    return false;
  }

  /** Wrappers to access elementHandler functions */
  addStereotypeToElement(): void {
    this.elementHandler.addTempStereotypeToElement();
  }

  removeStereotypeFromElement(): void {
    this.elementHandler.removeStereotypeByName(this.getTitle());
  }

  initAllElementStereotypesSettings(): void {
    this.elementHandler.initElementStereotypeSettings();
  }

  terminateStereotypeEditProcess(): void {
    this.elementHandler.terminateStereotypeEditProcess();
  }

  updateModelContentVariable(xml: string): void {
    this.elementHandler.updateModelContentVariable(xml);
  }

  /** Wrappers to access validationHandler functions */
  addUniqueErrorToErrorsList(errors: ValidationErrorObject[], error: string, ids: string[], highlight: string[]): void {
    this.validationHandler.addUniqueErrorToErrorsList(errors, error, ids, highlight);
  }

  // Get unique values of an array
  getUniqueValuesOfArray(array: string[]): string[] {
    return this.validationHandler.getUniqueValuesOfArray(array);
  }

}