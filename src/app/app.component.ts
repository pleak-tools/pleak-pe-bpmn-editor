import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ToastrService } from 'ngx-toastr';

import { AuthService } from './auth/auth.service';
import { EditorService } from './editor/editor.service';

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

  public modelId: string;
  public viewerType: string;
  public file: any;
  private fileOpenedTime: number;

  canSave: boolean = false;
  authenticated: boolean;

  fileLoaded: boolean = false;

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  setUserEmail(value: string): void {
    this.authService.setLoginCredentialsEmail(value);
  }

  setUserPassword(value: string): void {
    this.authService.setLoginCredentialsPassword(value);
  }

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }

  @HostListener('window:beforeunload', ['$event'])
  doSomething($event): void {
    if (this.file.content !== this.editorService.getModel()) {
      $event.returnValue = 'Are you sure you want to close this tab? Unsaved progress will be lost?';
    }
  }

  loadModel(): void {

    this.http.get(config.backend.host + '/rest/directories/files/' + (this.viewerType === 'public' ? 'public/' : '') + this.modelId, AuthService.loadRequestOptions()).subscribe(

      (response: any) => {

        this.file = response;
        this.fileOpenedTime = new Date().getTime();
        document.title = 'Pleak PE-BPMN & Leaks-When editor - ' + this.file.title;
        if (this.viewerType === 'public' && this.isAuthenticated()) {
          this.getPermissions(this.file.id);
        } else {
          this.editorService.loadModel(this.file.content, this.canEdit(), this.file.id);
        }
      }
    );
  }

  saveModel(): void {

    const requestItem = Object.assign({}, this.file);
    Object.assign(requestItem, { content: this.editorService.getModel() });

    this.http.put(config.backend.host + '/rest/directories/files/' + this.modelId, requestItem, AuthService.loadRequestOptions()).subscribe(
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

  private getPermissions(id: string): void {
    this.http.get(config.backend.host + '/rest/directories/files/' + id, AuthService.loadRequestOptions()).subscribe(
      (response: any) => {
        this.file.permissions = response.permissions;
        this.file.user = response.user;
        this.file.md5Hash = response.md5Hash;
        this.editorService.loadModel(this.file.content, this.canEdit(), id);
      },
      () => {
        this.editorService.loadModel(this.file.content, this.canEdit(), id);
      }
    );
  }

  canEdit(): boolean {
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

  ngOnInit(): void {
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
