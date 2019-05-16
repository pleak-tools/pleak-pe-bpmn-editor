import { Component, Input } from '@angular/core';
import { AuthService } from "../../auth/auth.service";
import { SqlBPMNModdle } from "../bpmn-labels-extension";
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "../handler/elements-handler";
import { HttpClient } from '@angular/common/http';

declare let $: any;
declare function require(name: string);
let is = (element, type) => element.$instanceOf(type);

const config = require('../../../config.json');

@Component({
  selector: 'app-pe-bpmn-editor-export',
  templateUrl: './export.component.html'
})
export class ExportComponent {

  constructor(public http: HttpClient, private authService: AuthService) {

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
    this.http.get(config.backend.host + '/rest/directories/files/' + (this.viewerType === 'public' ? 'public/' : '') + this.modelId, AuthService.loadRequestOptions()).subscribe(
      (repsonse: any) => {
        const file = repsonse;
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
    this.http.get(config.backend.host + '/rest/directories/files/' + file.id, AuthService.loadRequestOptions()).subscribe(
      (response: any) => {
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
