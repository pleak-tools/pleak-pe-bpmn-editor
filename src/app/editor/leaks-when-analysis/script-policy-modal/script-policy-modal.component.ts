import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';

declare let $: any;

@Component({
  selector: 'app-script-policy-modal',
  templateUrl: './script-policy-modal.component.html',
  styleUrls: ['./script-policy-modal.component.less'],
})
export class ScriptPolicyModalComponent {

  @Input() activeMode: string;
  @Input()canEdit: boolean;

  @Output() scriptOrPolicy = new EventEmitter();
  @Output() save = new EventEmitter();

  @ViewChild('scriptPolicyCodeMirror', { static: false }) scriptPolicyInput: any;

  input: string = null;
  type: string = null;
  name: string = null;

  isBPMNLeaksWhenActive(): boolean {
    return this.activeMode === "BPMNleaks";
  }

  isSQLLeaksWhenActive(): boolean {
    return this.activeMode === "SQLleaks";
  }

  openModal(value: any): void {
    this.input = null;
    this.type = null;
    this.name = null;
    let inputObject = JSON.parse(value);
    this.type = inputObject.type;
    this.name = inputObject.name;
    setTimeout(() => {
      if (!inputObject.value || inputObject.value && inputObject.value.length === 0) {
        this.input = " ";
      } else {
        this.input = inputObject.value;
      }
    }, 200);
    $('#leaksWhenScriptOrPolicyModal').modal();
  }

  inputChanged(value: string): void {
    let inputObj = {type: this.type, value: ""};
    if (value === undefined || value === null || value.length === 0) {
      inputObj.value = "";
    } else {
      inputObj.value = value;
    }
    this.scriptOrPolicy.emit(JSON.stringify(inputObj));
  }

  saveInput(): void {
    this.save.emit();
    $('#leaksWhenScriptOrPolicyModal').modal('hide'); 
  }

}