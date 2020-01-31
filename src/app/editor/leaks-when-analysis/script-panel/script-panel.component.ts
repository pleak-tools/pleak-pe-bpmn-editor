import { Component, Input, Output, EventEmitter } from '@angular/core';

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

  isBPMNLeaksWhenActive(): boolean {
    return this.activeMode === "BPMNleaks";
  }

  isSQLLeaksWhenActive(): boolean {
    return this.activeMode === "SQLleaks";
  }

  getScript(): string {
    return this.selectedElement.businessObject.sqlScript ? this.selectedElement.businessObject.sqlScript : "";
  }

  scriptChanged(value: string): void {
    if (value === undefined || value === null || value.length === 0) {
      this.script.emit("");
    } else {
      this.script.emit(value);
    }
  }

}