import { Component, Input } from '@angular/core';
import { SqlBPMNModdle } from "./bpmn-labels-extension";
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./handler/elements-handler";
import { EditorService } from './editor.service';

declare let $: any;

@Component({
  selector: 'app-pe-bpmn-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.less']
})
export class EditorComponent {

  constructor(private editorService: EditorService) {
    this.editorService.newModel.subscribe(content => {
      this.modelId = this.editorService.modelId;
      this.openDiagram(content);
    });
  }

  @Input() authenticated: Boolean;

  public viewer: NavigatedViewer;

  elementsHandler: ElementsHandler;

  modelId: number;

  activeMode: string = "PEBPMN";

  setPEBPMNMode(): void {
    this.activeMode = "PEBPMN";
    if (this.elementsHandler) {
      this.elementsHandler.terminateElementsEditing();
      for (let dO of this.elementsHandler.selectedDataObjects) {
        this.elementsHandler.canvas.removeMarker(dO.id, 'highlight-input-selected');
      }
      this.elementsHandler.selectedDataObjects = [];
    }
  }

  setBPMNLeaksWhenMode(): void {
    this.activeMode = "BPMNleaks";
    if (this.elementsHandler) {
      this.elementsHandler.terminateElementsEditing();
      for (let dO of this.elementsHandler.selectedDataObjects) {
        this.elementsHandler.canvas.removeMarker(dO.id, 'highlight-input-selected');
      }
      this.elementsHandler.selectedDataObjects = [];
    }
  }

  setSQLLeaksWhenMode(): void {
    this.activeMode = "SQLleaks";
    if (this.elementsHandler) {
      this.elementsHandler.terminateElementsEditing();
      for (let dO of this.elementsHandler.selectedDataObjects) {
        this.elementsHandler.canvas.removeMarker(dO.id, 'highlight-input-selected');
      }
      this.elementsHandler.selectedDataObjects = [];
    }
  }

  isPEBPMModeActive(): boolean {
    return this.activeMode === "PEBPMN";
  }

  isBPMNLeaksWhenActive(): boolean {
    return this.activeMode === "BPMNleaks";
  }

  isSQLLeaksWhenActive(): boolean {
    return this.activeMode === "SQLleaks";
  }

  validateModel(): void {
    this.editorService.analyze();
  }

  modelLoaded(): boolean {
    if (this.elementsHandler) {
      return this.elementsHandler.modelLoaded;
    }
    return false;
  }

  // Load diagram and add editor
  openDiagram(diagram: string): void {
    if (diagram) {
      $('#canvas').html('');
      this.viewer = new NavigatedViewer({
        container: '#canvas',
        keyboard: {
          bindTo: document
        },
        moddleExtensions: {
          sqlExt: SqlBPMNModdle
        }
      });

      this.elementsHandler = new ElementsHandler(this.viewer, diagram, this, this.canEdit());
      this.elementsHandler.init();
      this.addEventHandlers(this.elementsHandler);
    }
  }

  canEdit(): boolean {
    return this.editorService.canEdit;
  }

  addEventHandlers(elementsHandler: ElementsHandler): void {

    this.removeEventHandlers();

    this.editorService.analyze = () => elementsHandler.initValidation();

    $('.buttons-container').on('click', '.buttons a', (e) => {
      if (!$(e.target).is('.active')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    $(window).on('wheel', (event) => {
      // Change the color of stereotype labels more visible when zooming out
      let zoomLevel = this.viewer.get('canvas').zoom();
      if (zoomLevel < 1.0) {
        if ($('.stereotype-label-color').css("color") != "rgb(0, 0, 255)") {
          $('.stereotype-label-color').css('color', 'blue');
        }
      } else {
        if ($('.stereotype-label-color').css("color") != "rgb(0, 0, 139)") {
          $('.stereotype-label-color').css('color', 'darkblue');
        }
      }
    });

  }

  removeEventHandlers(): void {
    $('.buttons-container').off('click', '.buttons a');
    $(window).off('keydown');
    $(window).unbind('beforeunload');
    $(window).off('wheel');
  }

  initExportButton(): void {
    this.loadExportButton();
    $(document).off('click', '#download-diagram');
    $(document).on('click', '#download-diagram', (e) => {
      this.loadExportButton();
    });

  }

  loadExportButton(): void {
    this.viewer.saveXML(
      {
        format: true
      },
      (err: any, xml: string) => {
        let encodedData = encodeURIComponent(xml);
        if (xml) {
          $('#download-diagram-container').removeClass('hidden');
          $('#download-diagram').addClass('active').attr({
            'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
            'download': $('#fileName').text()
          });
        }
      }
    );
  }

}
