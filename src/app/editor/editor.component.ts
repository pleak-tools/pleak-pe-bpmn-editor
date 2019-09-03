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

  modelId: number;

  // Load diagram and add editor
  openDiagram(diagram: string) {
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

      let elementsHandler = new ElementsHandler(this.viewer, diagram, this, this.canEdit());
      elementsHandler.init();
      this.addEventHandlers(elementsHandler);
    }
  }

  canEdit() {
    return this.editorService.canEdit;
  }

  addEventHandlers(elementsHandler) {

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

  removeEventHandlers() {
    $('.buttons-container').off('click', '.buttons a');
    $(window).off('keydown');
    $(window).unbind('beforeunload');
    $(window).off('wheel');
  }

}
