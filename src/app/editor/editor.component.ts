import { Component, OnInit, Input } from '@angular/core';
import { Http } from '@angular/http';
import { AuthService } from "app/auth/auth.service";
import { SqlBPMNModdle } from "./bpmn-labels-extension";
import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ElementsHandler } from "./handler/elements-handler";

declare var $: any;
declare function require(name:string);
let is = (element, type) => element.$instanceOf(type);

var config = require('../../config.json');

@Component({
  selector: 'app-pe-bpmn-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.less']
})
export class EditorComponent implements OnInit {

  constructor(public http: Http, private authService: AuthService) {
    this.authService.authStatus.subscribe(status => {
      this.authenticated = status;
      this.getModel();
    });
  }

  @Input() authenticated: Boolean;

  private viewer: Viewer;

  private modelId: Number = Number.parseInt(window.location.pathname.split('/')[2]);

  private saveFailed: Boolean = false;
  private lastContent: String = '';

  private fileId: Number = null;
  private file: any;

  isAuthenticated() {
    return this.authenticated;
  }

  // Load model
  getModel() {
    var self = this;
    $('#canvas').html('');
    $('.buttons-container').off('click', '#save-diagram');
    self.viewer = null;
    this.http.get(config.backend.host + '/rest/directories/files/' + self.modelId, this.authService.loadRequestOptions()).subscribe(
      success => {
        self.file = JSON.parse((<any>success)._body);
        self.fileId = self.file.id;
        if (self.file.content.length === 0) {
          console.log("File can't be found or opened!");
        }
        self.openDiagram(self.file.content);
        self.lastContent = self.file.content;
        document.title = 'Pleak PE-BPMN editor - ' + self.file.title;
      },
      fail => {
        self.fileId = null;
        self.file = null;
        self.lastContent = '';
        self.saveFailed = false;
      }
    );
  }

  // Load diagram and add editor
  openDiagram(diagram: String) {
    var self = this;
    if (diagram && this.viewer == null) {
      this.viewer = new Viewer({
        container: '#canvas',
        keyboard: {
          bindTo: document 
        },
        moddleExtensions: {
          sqlExt: SqlBPMNModdle
        }
      });

      new ElementsHandler(this.viewer, diagram, this);

      $('.buttons-container').on('click', '#save-diagram', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.save();
      });

      $(window).on('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          switch (String.fromCharCode(e.which).toLowerCase()) {
            case 's':
              event.preventDefault();
              this.save();
              break;
          }
        }
      });

      $(window).bind('beforeunload', (e) => {
        if (this.file.content != this.lastContent) {
          return 'Are you sure you want to close this tab? Unsaved progress will be lost.';
        }
      });
    }
  }

  // Save model
  save() {
    var self = this;
    this.viewer.saveXML(
      {
        format: true
      },
      (err: any, xml: string) => {
        if (err) {
          console.log(err)
        } else {
          self.file.content = xml;
          this.http.put(config.backend.host + '/rest/directories/files/' + self.fileId, self.file, this.authService.loadRequestOptions()).subscribe(
            success => {
              console.log(success)
              if (success.status === 200 || success.status === 201) {
                var data = JSON.parse((<any>success)._body);
                $('#fileSaveSuccess').show();
                $('#fileSaveSuccess').fadeOut(5000);
                var date = new Date();
                localStorage.setItem("lastModifiedFileId", '"' + data.id + '"');
                localStorage.setItem("lastModified", '"' + date.getTime() + '"');
                if (self.fileId !== data.id) {
                  window.location.href = config.frontend.host + '/modeler/' + data.id;
                }
                self.file.md5Hash = data.md5Hash;
                self.lastContent = self.file.content;
                self.fileId = data.id;
                self.saveFailed = false;
              } else if (success.status === 401) {
                 self.saveFailed = true;
                 $('#loginModal').modal();
              }
            },
            fail => {
            }
          );
          console.log(xml)
        }
      });
  }

  updateModelContentVariable(xml: String) {
    if (xml) {
      this.file.content = xml;
    }
  }

  ngOnInit() {
    window.addEventListener('storage', (e) => {
      if (e.storageArea === localStorage) {
        this.authService.verifyToken();
        this.getModel();
      }
    });
  }

}
