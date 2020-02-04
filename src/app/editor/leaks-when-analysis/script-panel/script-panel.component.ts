import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';

@Component({
  selector: 'app-script-panel',
  templateUrl: './script-panel.component.html',
  styleUrls: ['./script-panel.component.less']
})
export class ScriptPanelComponent {

  @Input() activeMode: string;
  @Input() selectedElement: any;
  @Input() isScriptElement: boolean;
  @Input() canEdit: boolean;

  @Output() script = new EventEmitter();
  @Output() open = new EventEmitter();

  @ViewChild('scriptCodeMirror', { static: false }) scriptInput: any;

  isBPMNLeaksWhenActive(): boolean {
    return this.activeMode === "BPMNleaks";
  }

  isSQLLeaksWhenActive(): boolean {
    return this.activeMode === "SQLleaks";
  }

  getScript(): string {
    return this.selectedElement && this.selectedElement.businessObject && this.selectedElement.businessObject.sqlScript ? this.selectedElement.businessObject.sqlScript : "";
  }

  scriptChanged(value: string): void {
    if (value === undefined || value === null || value.length === 0) {
      this.script.emit("");
    } else {
      this.script.emit(value);
    }
  }

  openModal(type: string): void {
    this.open.emit(JSON.stringify({type: type, value: this.scriptInput.value}));
  }

}