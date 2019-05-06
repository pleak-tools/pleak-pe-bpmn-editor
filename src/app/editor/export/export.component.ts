import { Component, OnInit, Input } from '@angular/core';
import { Http } from '@angular/http';
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
  templateUrl: './export.component.html'
})
export class ExportComponent {

  constructor(public http: Http, private authService: AuthService) {

    let pathname = window.location.pathname.split('/');
    if (pathname[2] === 'export') {
      this.modelId = pathname[3];
      this.exportType = pathname[4];
      this.export();
    }
    this.authService.authStatus.subscribe(status => {
      this.authenticated = status;
    });
  }

  @Input() authenticated: Boolean;

  private viewer: NavigatedViewer;

  private modelId: string;
  private viewerType: string;
  private exportType: string;

  isAuthenticated() {
    return this.authenticated;
  }

  export(): void {
    this.http.get(config.backend.host + '/rest/directories/files/' + (this.viewerType == 'public' ? 'public/' : '') + this.modelId, this.authService.loadRequestOptions()).subscribe(
      success => {
        let file = JSON.parse((<any>success)._body);
        if (file.content.length === 0) {
          console.log("File can't be found or opened!");
        }
        if (this.viewerType === 'public' && this.isAuthenticated()) {
          this.getPermissions(file);
        } else {
          if (file.content && this.viewer == null) {
            this.viewer = new NavigatedViewer({
              container: '#xcanvas',
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
        }
      },
      fail => {
      }
    );
  }

  getPermissions(file): void {
    this.http.get(config.backend.host + '/rest/directories/files/' + file.id, this.authService.loadRequestOptions()).subscribe(
      success => {
        let response = JSON.parse((<any>success)._body);
        file.permissions = response.permissions;
        file.user = response.user;
        file.md5Hash = response.md5Hash;
      },
      () => { }
    );
  }

  canEdit(file): boolean {
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
