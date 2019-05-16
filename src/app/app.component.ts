import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ToastrService } from 'ngx-toastr';

import { AuthService } from './auth/auth.service';
import { EditorService } from './editor/editor.service';
import { ElementsHandler } from './editor/handler/elements-handler';

import { SqlBPMNModdle } from "./editor/bpmn-labels-extension";
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';


declare function require(name: string);
const config = require('../config.json');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private editorService: EditorService, private http: HttpClient, private toastr: ToastrService) {
    const pathname = window.location.pathname.split('/');
    if (pathname[2] === 'viewer') {
      this.modelId = pathname[3];
      this.viewerType = 'public';
    } else if (pathname[2] === 'export') {
      this.modelId = pathname[3];
      this.exportType = pathname[4];
      this.export();
    } else {
      this.modelId = pathname[2];
      this.viewerType = 'private';
    }

    this.authService.authStatus.subscribe(status => {
      this.authenticated = status;
      if (typeof (status) === 'boolean') {
        this.loadModel();
      }
    });


    this.editorService.model.subscribe(content => {
      this.canSave = content && content !== this.file.content;
    });

    this.loadModel();
  }

  private modelId;
  private viewerType;
  private file;
  private fileOpenedTime: number;
  private exportType: string;

  canSave = false;
  authenticated: Boolean;

  isAuthenticated() {
    return this.authenticated;
  }

  setUserEmail(value: string) {
    this.authService.setLoginCredentialsEmail(value);
  }

  setUserPassword(value: string) {
    this.authService.setLoginCredentialsPassword(value);
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  @HostListener('window:beforeunload', ['$event'])
  doSomething($event) {
    if (this.file.content !== this.editorService.getModel()) {
      $event.returnValue = 'Are you sure you want to close this tab? Unsaved progress will be lost?';
    }
  }

  loadModel() {

    this.http.get(config.backend.host + '/rest/directories/files/' + (this.viewerType === 'public' ? 'public/' : '') + this.modelId, { headers: { 'JSON-Web-Token': localStorage.jwt || '' } }).subscribe(

      (response: any) => {

        this.file = response;
        this.fileOpenedTime = new Date().getTime();
        document.title = 'Pleak PE-BPMN editor - ' + this.file.title;

        if (this.viewerType === 'public' && this.isAuthenticated()) {
          this.getPermissions(this.file.id);
        } else {
          this.editorService.loadModel(this.file.content, this.canEdit());
        }
      }
    );
  }

  saveModel() {

    const requestItem = Object.assign({}, this.file);
    Object.assign(requestItem, { content: this.editorService.getModel() });

    this.http.put(config.backend.host + '/rest/directories/files/' + this.modelId, requestItem, { headers: { 'JSON-Web-Token': localStorage.jwt || '' } }).subscribe(
      (response: any) => {
        this.file = response;
        this.canSave = false;

        localStorage.setItem('lastModifiedFileId', `"${response.id}"`);
        localStorage.setItem('lastModified', `"${(new Date()).getTime()}"`);

        this.toastr.success('Model saved', '', { disableTimeOut: true });
      },
      () => {
        this.toastr.warning('Error saving model');
      }
    );
  }

  validateModel() {
    this.editorService.analyze();
  }

  private getPermissions(id: number) {
    this.http.get(config.backend.host + '/rest/directories/files/' + id, { headers: { 'JSON-Web-Token': localStorage.jwt || '' } }).subscribe(
      (response: any) => {
        this.file.permissions = response.permissions;
        this.file.user = response.user;
        this.file.md5Hash = response.md5Hash;
      },
      () => { },
      () => {
        this.editorService.loadModel(this.file.content, this.canEdit());
      }
    );
  }

  private canEdit() {
    const file = this.file;

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

  export(): void {
    this.http.get(config.backend.host + '/rest/directories/files/' + (this.viewerType === 'public' ? 'public/' : '') + this.modelId, { headers: { 'JSON-Web-Token': localStorage.jwt || '' } }).subscribe(
      (response: any) => {
        let file = response;
        let viewer = null;
        if (file.content.length === 0) {
          this.toastr.error('File cannot be found or opened!', '', { disableTimeOut: true });
        }
        if (this.viewerType === 'public' && this.isAuthenticated()) {
          this.getExportedFilePermissions(file.id);
        } else {
          if (file.content && viewer == null) {
            viewer = new NavigatedViewer({
              container: '#canvas',
              keyboard: {
                bindTo: document
              },
              moddleExtensions: {
                sqlExt: SqlBPMNModdle
              }
            });

            let elementsHandler = new ElementsHandler(viewer, file.content, this, this.canEditExportedFile(file));
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
      (fail) => {
      }
    );
  }

  private getExportedFilePermissions(file): void {
    this.http.get(config.backend.host + '/rest/directories/files/' + file.id, { headers: { 'JSON-Web-Token': localStorage.jwt || '' } }).subscribe(
      success => {
        let response = JSON.parse((<any>success)._body);
        file.permissions = response.permissions;
        file.user = response.user;
        file.md5Hash = response.md5Hash;
      },
      () => { }
    );
  }

  private canEditExportedFile(file: any): boolean {
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

  ngOnInit() {
    window.addEventListener('storage', (e) => {
      if (e.storageArea === localStorage) {
        if (!this.authService.verifyToken()) {
          this.loadModel();
        } else {
          const lastModifiedFileId = Number(localStorage.getItem('lastModifiedFileId').replace(/['"]+/g, ''));
          let currentFileId = null;
          if (this.file) {
            currentFileId = this.file.id;
          }
          const localStorageLastModifiedTime = Number(localStorage.getItem('lastModified').replace(/['"]+/g, ''));
          const lastModifiedTime = this.fileOpenedTime;
          if (lastModifiedFileId && currentFileId && localStorageLastModifiedTime && lastModifiedTime && lastModifiedFileId === currentFileId && localStorageLastModifiedTime > lastModifiedTime) {
            this.loadModel();
          }
        }
      }
    });
  }
}
