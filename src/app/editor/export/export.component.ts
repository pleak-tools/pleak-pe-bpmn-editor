import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from "../../auth/auth.service";
import { SqlBPMNModdle } from "../bpmn-labels-extension";
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "../handler/elements-handler";

declare let $: any;
declare function require(name: string);
let is = (element, type) => element.$instanceOf(type);

let config = require('../../../config.json');

@Component({
  selector: 'app-pe-bpmn-editor-export',
  template: '<div id="xcanvas" style="display:none"></div>'
})
export class ExportComponent {

  constructor(public http: HttpClient, private authService: AuthService) {

    let pathname = window.location.pathname.split('/');
    if (pathname[2] === 'export') {
      this.modelId = pathname[3];
      this.exportType = pathname[4];
      this.export();
    }
  }

  @Input() authenticated: Boolean;

  private viewer: NavigatedViewer;

  private modelId: string;
  private exportType: string;

  isAuthenticated() {
    return this.authenticated;
  }

  export(): void {
    this.http.get(config.backend.host + '/rest/directories/files/' + this.modelId, { headers: { 'JSON-Web-Token': localStorage.jwt || '' } }).subscribe(
      (response: any) => {
        let file = response;
        if (file.content.length === 0) {
          console.log("File can't be found or opened!");
        }
        if (file.content && this.viewer == null) {
          this.viewer = new NavigatedViewer({
            container: '#canvas',
            keyboard: {
              bindTo: document
            },
            moddleExtensions: {
              sqlExt: SqlBPMNModdle
            }
          });

          let elementsHandler = new ElementsHandler(this.viewer, file.content, this, this.canEdit(file));
          elementsHandler.init().then(() => {
            let message = "";
            if (this.exportType == "esd") {
              message = JSON.stringify(elementsHandler.validationHandler.extendedSimpleDisclosureAnalysisHandler.createSimpleDisclosureReportTable());
            } else {
              message = JSON.stringify("error");
            }
            localStorage.setItem('esdInfo', message);
            localStorage.setItem('esdInfoStatus', 'done');
          });
        }
      },
      (fail) => {
      }
    );
  }

  private canEdit(file: any): boolean {

    if (!file || !this.isAuthenticated()) { return false; }
    if ((this.authService.user && file.user) ? file.user.email === this.authService.user.email : false) { return true; }
    for (let pIx = 0; pIx < file.permissions.length; pIx++) {
      if (file.permissions[pIx].action.title === 'edit' &&
        this.authService.user ? file.permissions[pIx].user.email === this.authService.user.email : false) {
        return true;
      }
    }
    return false;
  }

}
