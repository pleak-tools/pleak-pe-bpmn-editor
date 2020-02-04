import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';

@Component({
  selector: 'app-policy-panel',
  templateUrl: './policy-panel.component.html',
  styleUrls: ['./policy-panel.component.less']
})
export class PolicyPanelComponent {

  @Input() activeMode: string;
  @Input() selectedElement: any;
  @Input() isPolicyElement: boolean;
  @Input() canEdit: boolean;
  @Input() roles: string[];

  @Output() policy = new EventEmitter();
  @Output() open = new EventEmitter();

  @ViewChild('policyCodeMirror', { static: false }) policyInput: any;

  isSQLLeaksWhenActive(): boolean {
    return this.activeMode === "SQLleaks";
  }

  getPolicy(): string {
    return this.selectedElement && this.selectedElement.businessObject && this.selectedElement.businessObject.policyScript ? this.selectedElement.businessObject.policyScript : "";
  }

  policyChanged(value: string): void {
    if (value === undefined || value === null || value.length === 0) {
      this.policy.emit("");
    } else {
      this.policy.emit(value);
    }
  }

  openModal(type: string): void {
    this.open.emit(JSON.stringify({type: type, value: this.policyInput.value}));
  }

}