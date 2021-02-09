import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { timeout } from 'rxjs/operators';

declare let $: any;
declare function require(name: string);
const config = require('../../../config.json');

@Component({
  selector: 'app-leakage-detection',
  templateUrl: './leakage-detection.component.html',
  styleUrls: ['./leakage-detection.component.less']
})
export class LeakageDetectionComponent {

  constructor(private authService: AuthService, private http: HttpClient) {
    this.authService.authStatus.subscribe(status => {
      this.authenticated = status;
    });
  }

  @Input() authenticated: Boolean;
  @Input() modelId: number;
  @Input() viewer: any;
  @Input() elementsHandler: any;

  public canvas: any;
  public registry: any;

  private leakagesInfo: any = {};

  public verificationType = null;

  public leakagesStep2Elements: any[] = [];
  public leakagesStep3Elements: any[] = [];

  public leakagesStepType: number = 0;
  public leakagesAnalysisTarget: string = "";
  public leakagesAnalysisFinalTargets: string = "";

  public leakagesResults: any = {};

  public leakageAnalysisTypeDescription: string = "";

  public leakageAnalysisInprogress: boolean = false;

  private previousSuccessfulRequestAndResults: any = {};

  public descriptionCollapsed: boolean = false;
  public step2collapsed: boolean = false;
  public step3collapsed: boolean = false;
  public resultsCollapsed: boolean = false;

  public analysisStopped: boolean = false;

  detectLeakagesAnalysisRequest(requestData: any, requestType: number, redirectCount: number, step: number): Promise<any> {
    this.canvas = this.viewer.get('canvas');
    this.registry = this.viewer.get('elementRegistry');
    if (!this.analysisStopped) {
      this.leakageAnalysisInprogress = true;
      redirectCount = redirectCount || 0;
      // console.log(redirectCount)
      if (redirectCount == 100) {
        this.leakageAnalysisInprogress = false;
        this.leakagesResults = { success: false, error: "error4" };
        return;
      }
      return new Promise((resolve) => {
        let requestUrl = '';
        if (requestType === 1) {
          requestUrl = '/rest/pe-bpmn-leaks-when/leakage-detection-analysis-verification';
        } else if (requestType === 2) {
          requestUrl = '/rest/pe-bpmn-leaks-when/leakage-detection-analysis-step1';
        } else if (requestType === 3) {
          requestUrl = '/rest/pe-bpmn-leaks-when/leakage-detection-analysis-step2';
        }

        this.http.post(config.backend.host + requestUrl, requestData, AuthService.loadRequestOptions({ observe: 'response' })).pipe(
          timeout(300000)
        ).subscribe(
          (response: any) => {

            if (response.status === 200 && response.body !== null) {
              if (response.body.result.indexOf("[error]") === -1 && response.body.result != "\n" && response.body.result.indexOf("Generated") === -1) {
                this.leakagesInfo = response.body.result;
                this.previousSuccessfulRequestAndResults.request = { requestType: requestType, verificationType: requestData.verificationType, analysisTarget: this.leakagesAnalysisTarget, analysisFinalTargets: this.leakagesAnalysisFinalTargets };
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          },
          (fail: any) => {
            resolve(false);
          }
        );


      })
        .then((result) => {
          return !result ? this.detectLeakagesAnalysisRequest(requestData, requestType, redirectCount + 1, step) : this.showRequestResult(requestData, this.leakagesInfo, step);
        });
    }
  }

  getFormattedResults(resultString: string, requestData: any): any {
    if (resultString != "false" && resultString != "NEVER HAS THIS NUMBER OF PARAMETERS" && resultString != "No SSsharing PET over this model" && resultString != "No reconstruction task in the model" && resultString != "No MPC task in the model" && resultString != "No deadlock" && resultString != "Secret ALWAYS reconstructed" && resultString != "Parallelism PRESERVED") {
      let flag = false;
      if (resultString.indexOf("Parallelism is NOT preserved") !== -1 || resultString.indexOf("Secret NOT reconstructed") !== -1) {
        resultString = resultString.replace("\nParallelism is NOT preserved\n", "").replace("\nSecret NOT reconstructed\n", "");
        flag = true;
      }
      if (requestData.verificationType === 4 || requestData.verificationType === 5) {
        flag = true;
      }
      let tmp = resultString.replace('\n', '').replace(/^\s+|\s+$/gm, '').replace(/\(/g, '"').replace(/\)/g, '"');
      tmp = tmp.substring(1, tmp.length - 1);
      let tmp2 = tmp.split('",');
      let result = [];
      for (let c of tmp2) {
        let elems = c.replace(/^\s+|\s+$/gm, '').replace(/\"/g, '').split(',[');
        let task = elems[0];
        let dObjects = elems[1].substring(0, elems[1].length - 1);
        let taskName = this.registry.get(task) && this.registry.get(task).businessObject.name ? this.registry.get(task).businessObject.name.trim() : "unnamed";
        result.push({ taskId: task, task: taskName, dataObjects: dObjects });
      }
      if (flag) {
        return { success: true, result: result, code: "-1" };
      }
      return { success: true, result: result, code: "1" };
    } else if (resultString == "Secret ALWAYS reconstructed") {
      return { success: true, code: "2" };
    } else if (resultString == "Parallelism PRESERVED") {
      return { success: true, code: "3" };
    } else if (resultString == "false") {
      return { success: false, error: "error1" };
    } else if (resultString == "NEVER HAS THIS NUMBER OF PARAMETERS") {
      return { success: false, error: "error2" };
    } else if (resultString == "No SSsharing PET over this model") {
      return { success: false, error: "error3" };
    } else if (resultString == "No reconstruction task in the model") {
      // error4 reserved for analyser error
      return { success: false, error: "error5" };
    } else if (resultString == "No MPC task in the model") {
      return { success: false, error: "error6" };
    } else if (resultString == "No deadlock") {
      return { success: false, error: "error7" };
    }

    return { success: false, error: resultString };
  }

  showRequestResult(requestData: any, resultData: string, step: number): void {
    if (step === 1) {
      if (requestData.verificationType === 1 || requestData.verificationType === 2) {
        let tmp = [];
        for (let element of resultData.trim().split("\n")) {
          if (element.indexOf("Name:") !== -1) {
            let id = element.substring(4, element.indexOf("Name:")).trim();
            let name = element.substring(element.indexOf("Name:") + 6, element.length) ? element.substring(element.indexOf("Name:") + 6, element.length) : "unnamed";
            let obj = { id: id, name: name, selected: false };
            tmp.push(obj);
          } else if (element.indexOf("NAME:") !== -1) {
            let id = element.substring(4, element.indexOf("NAME:")).trim();
            let name = element.substring(element.indexOf("NAME:") + 6, element.length) ? element.substring(element.indexOf("NAME:") + 6, element.length) : "unnamed";
            let obj = { id: id, name: name, selected: false };
            tmp.push(obj);
          } else {
            let id = element.trim().replace("ID: ", "");
            let name = id;
            let obj = { id: id, name: name, selected: false };
            tmp.push(obj);
          }
        }
        this.leakagesStep2Elements = tmp;
        this.toggleStep2SelectedElements(tmp[0].id);
        this.leakagesStepType = requestData.verificationType;
      } else if (requestData.verificationType === 3 || requestData.verificationType === 4 || requestData.verificationType === 5 || requestData.verificationType === 6) {
        this.leakagesResults = this.getFormattedResults(resultData, requestData);
      }
    } else if (step === 2) {
      if (requestData.verificationType === 1 || requestData.verificationType === 2) {
        let tmp = [];
        for (let element of resultData.split("\n")) {
          let name = element.trim();
          let obj = { name: name, selected: false };
          tmp.push(obj);
        }
        this.leakagesStep3Elements = tmp;
        this.toggleStep3SelectedElements(tmp[0].name);
        this.leakagesStepType = requestData.verificationType;
      }
    } else if (step === 3) {
      this.leakagesResults = this.getFormattedResults(resultData, requestData);
      this.leakagesStepType = requestData.verificationType;
    }
    this.leakageAnalysisInprogress = false;
  }

  isRequestNew(verificationType: number, requestType: number, analysisTarget: string, analysisFinalTargets: string): boolean {
    if (this.previousSuccessfulRequestAndResults &&
      this.previousSuccessfulRequestAndResults.request &&
      this.previousSuccessfulRequestAndResults.request.requestType == requestType &&
      this.previousSuccessfulRequestAndResults.request.verificationType === verificationType &&
      this.previousSuccessfulRequestAndResults.request.analysisTarget === analysisTarget &&
      this.previousSuccessfulRequestAndResults.request.analysisFinalTargets === analysisFinalTargets) {
      // console.log("same request again");
      return false;
    }
    return true;
  }


  taskVerification(): void {
    this.analysisStopped = false;
    this.verificationType = 1;
    let obj = { modelId: this.modelId, verificationType: 1 };
    if (this.isRequestNew(obj.verificationType, 1, "", "")) {
      this.leakagesStep2Elements = [];
      this.leakagesStep3Elements = [];
      this.leakagesResults = "";
      this.leakageAnalysisTypeDescription = "Is it ever possible that a given task/participant T contains the set of data D?";
      this.detectLeakagesAnalysisRequest(obj, 1, 0, 1);
    }
  }

  participantVerification(): void {
    this.analysisStopped = false;
    this.verificationType = 2;
    let obj = { modelId: this.modelId, verificationType: 2 };
    if (this.isRequestNew(obj.verificationType, 1, "", "")) {
      this.leakagesStep2Elements = [];
      this.leakagesStep3Elements = [];
      this.leakagesResults = "";
      this.leakageAnalysisTypeDescription = "Is it ever possible that a given task/participant T contains the set of data D?";
      this.detectLeakagesAnalysisRequest(obj, 1, 0, 1);
    }
  }

  variousVerification(): void {
    this.analysisStopped = false;
    this.verificationType = 3;
    let obj = { modelId: this.modelId, verificationType: 3 };
    if (this.isRequestNew(obj.verificationType, 1, "", "")) {
      this.leakagesStep2Elements = [];
      this.leakagesStep3Elements = [];
      this.leakagesResults = "";
      this.leakageAnalysisTypeDescription = "Is it ever possible that SSSharing, AddSSSharing, FunSSSharing, PKEncryption or SKEncryption is violated in the model?<br><br>We say that the technology is violated if some participant can remove the protection given by the technology (e.g. has both the ciphertext and the private key for PKEncryption) but does not have the explicit removing task (e.g. PKDecryption) in the process and is not the party that created the protected data object (e.g had the PKEncryption task).";
      this.detectLeakagesAnalysisRequest(obj, 1, 0, 1);
    }
  }

  reconstructionVerification(): void {
    this.analysisStopped = false;
    this.verificationType = 4;
    let obj = { modelId: this.modelId, verificationType: 4 };
    if (this.isRequestNew(obj.verificationType, 1, "", "")) {
      this.leakagesStep2Elements = [];
      this.leakagesStep3Elements = [];
      this.leakagesResults = "";
      this.leakageAnalysisTypeDescription = "Is reconstruction always possible?";
      this.detectLeakagesAnalysisRequest(obj, 1, 0, 1);
    }
  }

  MPCVerification(): void {
    this.analysisStopped = false;
    this.verificationType = 5;
    let obj = { modelId: this.modelId, verificationType: 5 };
    if (this.isRequestNew(obj.verificationType, 1, "", "")) {
      this.leakagesStep2Elements = [];
      this.leakagesStep3Elements = [];
      this.leakagesResults = "";
      this.leakageAnalysisTypeDescription = "Are MPC tasks always executed in parallel?";
      this.detectLeakagesAnalysisRequest(obj, 1, 0, 1);
    }
  }

  deadLockFreedomVerification(): void {
    this.analysisStopped = false;
    this.verificationType = 6;
    let obj = { modelId: this.modelId, verificationType: 6 };
    if (this.isRequestNew(obj.verificationType, 1, "", "")) {
      this.leakagesStep2Elements = [];
      this.leakagesStep3Elements = [];
      this.leakagesResults = "";
      this.leakageAnalysisTypeDescription = "Is there a deadlock in the model, i.e. is there a trace in which one of the parties is not able to terminate its execution?";
      this.detectLeakagesAnalysisRequest(obj, 1, 0, 1);
    }
  }

  leakageDetectionAnalysisStep2(): void {
    this.analysisStopped = false;
    let selectedElement: any = this.leakagesStep2Elements.filter((element) => {
      return element.selected === true;
    });
    if (selectedElement && selectedElement.length > 0) {
      this.leakagesAnalysisTarget = selectedElement[0].id;
      let obj = { modelId: this.modelId, verificationType: this.leakagesStepType, analysisTarget: this.leakagesAnalysisTarget };
      if (this.isRequestNew(obj.verificationType, 2, obj.analysisTarget, "")) {
        this.leakagesStep3Elements = [];
        this.leakagesResults = "";
        this.detectLeakagesAnalysisRequest(obj, 2, 0, 2);
      }
    }
  }

  leakageDetectionAnalysisStep3(): void {
    this.analysisStopped = false;
    let selectedElements = this.getStep3SelectedElements();
    if (selectedElements.length > 0) {
      this.leakagesAnalysisFinalTargets = selectedElements;
      let obj = { modelId: this.modelId, verificationType: this.leakagesStepType, analysisTarget: this.leakagesAnalysisTarget, analysisFinalTargets: this.leakagesAnalysisFinalTargets };
      if (this.isRequestNew(obj.verificationType, 3, obj.analysisTarget, obj.analysisFinalTargets)) {
        this.leakagesResults = "";
        this.detectLeakagesAnalysisRequest(obj, 3, 0, 3);
      }
    }
  }

  toggleStep2SelectedElements(elementId: string): void {
    this.leakagesStep2Elements = this.leakagesStep2Elements.map((element) => {
      if (element.id === elementId) {
        element.selected = true;
        // this.canvas.addMarker(element.id, 'highlight-input-selected');
      } else {
        element.selected = false;
        // this.canvas.removeMarker(element.id, 'highlight-input-selected');
      }
      return element;
    });
  }

  toggleStep3SelectedElements(elementName: string): void {
    this.leakagesStep3Elements = this.leakagesStep3Elements.map((element) => {
      if (element.name === elementName) {
        element.selected = element.selected ? false : true;
      }
      return element;
    });
  }

  getStep2SelectedElement(): any[] {
    let selectedElement: any = this.leakagesStep2Elements.filter((element) => {
      return element.selected === true;
    });
    if (selectedElement && selectedElement.length > 0) {
      return selectedElement[0];
    }
    return null;
  }

  getStep3SelectedElements(): string {
    let selectedElements: any = this.leakagesStep3Elements.filter((element) => {
      return element.selected === true;
    }).map((element) => {
      return element.name;
    }).join(',');
    if (selectedElements && selectedElements.length > 0) {
      return selectedElements.replace(/^,|,$/g, '');
    }
    return "";
  }


  areStep2ElementsSelected(): boolean {
    let selectedElement = this.getStep2SelectedElement();
    if (selectedElement) {
      return true;
    }
    return false;
  }

  areStep3ElementsSelected(): boolean {
    let selectedElements = this.getStep3SelectedElements();
    if (selectedElements && selectedElements.length > 0) {
      return true;
    }
    return false;
  }

  static initLeakageDetectionModal(analysisPanel: any): void {
    analysisPanel.off('click', '#detect-leakages');
    analysisPanel.on('click', '#detect-leakages', (e) => {
      let $selector = $('#leakageDetectionModal');
      $selector.modal();
      return false;
    });
  }

  stopAnalysis(): void {
    this.analysisStopped = true;
    this.leakageAnalysisInprogress = false;
    this.previousSuccessfulRequestAndResults = {};
  }

  initPathHighlight(): void {
    this.terminatePathHighlight();
    if (this.leakagesResults && this.leakagesResults.result) {
      for (let row of this.leakagesResults.result) {
        let taskId = row.taskId;
        if (this.registry.get(taskId)) {
          this.canvas.addMarker(taskId, 'highlight-dd-between');
          if (this.registry.get(taskId).type === "bpmn:Task") {
            let taskHandler = this.elementsHandler.getTaskHandlerByTaskId(taskId);
            let taskInputs = taskHandler.getTaskInputObjects();
            let taskOutputs = taskHandler.getTaskOutputObjects();
            let allTaskDataObjectIds = taskInputs.concat(taskOutputs).map((obj) => obj.businessObject.id);

            for (let dO of row.dataObjects.split(',')) {
              let dOHandlers = [];
              let tmp = this.elementsHandler.getAllModelDataObjectHandlers().filter((obj) => {
                return obj.dataObject.name.trim() == dO.trim() || obj.dataObject.name.trim().replace('.', '_') == dO.trim();
              });
              if (tmp.length > 0) {
                dOHandlers = tmp;
              }
              if (dO && dOHandlers.length > 0) {
                for (let dOHandler of dOHandlers) {
                  if (allTaskDataObjectIds.indexOf(dOHandler.dataObject.id) !== -1) {
                    this.canvas.addMarker(dOHandler.dataObject.id, 'highlight-dd-between');
                  }
                }
              }
            }
          } else if (this.registry.get(taskId).type === "bpmn:IntermediateCatchEvent") {
            let event = this.registry.get(taskId);
            if (event.incoming && event.incoming.length > 0) {
              for (let con of event.incoming) {
                if (con.type == "bpmn:DataInputAssociation") {
                  for (let dO of row.dataObjects.split(',')) {
                    let dOHandlers = [];
                    let tmp = this.elementsHandler.getAllModelDataObjectHandlers().filter((obj) => {
                      return obj.dataObject.name.trim() == dO.trim() || obj.dataObject.name.trim().replace('.', '_') == dO.trim();
                    });
                    if (tmp.length > 0) {
                      dOHandlers = tmp;
                    }
                    if (dO && dOHandlers.length > 0) {
                      for (let dOHandler of dOHandlers) {
                        if (con.source && con.source.id == dOHandler.dataObject.id) {
                          this.canvas.addMarker(dOHandler.dataObject.id, 'highlight-dd-between');
                        }
                      }
                    }
                  }
                }
              }
            }
            if (event.outgoing && event.outgoing.length > 0) {
              for (let con of event.outgoing) {
                if (con.type == "bpmn:DataOutputAssociation") {
                  for (let dO of row.dataObjects.split(',')) {
                    let dOHandlers = [];
                    let tmp = this.elementsHandler.getAllModelDataObjectHandlers().filter((obj) => {
                      return obj.dataObject.name.trim() == dO.trim() || obj.dataObject.name.trim().replace('.', '_') == dO.trim();
                    });
                    if (tmp.length > 0) {
                      dOHandlers = tmp;
                    }
                    if (dO && dOHandlers.length > 0) {
                      for (let dOHandler of dOHandlers) {
                        if (con.target && con.target.id == dOHandler.dataObject.id) {
                          this.canvas.addMarker(dOHandler.dataObject.id, 'highlight-dd-between');
                        }
                      }
                    }
                  }
                }
              }
            }
          } else {
            console.log(taskId, " not highlighted");
          }
        }
      }
    }
  }

  terminatePathHighlight(): void {
    for (let dataObjectId of this.elementsHandler.getAllModelDataObjectHandlers().map(a => a.dataObject.id)) {
      this.canvas.removeMarker(dataObjectId, 'highlight-dd-input');
      this.canvas.removeMarker(dataObjectId, 'highlight-dd-output');
      this.canvas.removeMarker(dataObjectId, 'highlight-dd-between');
    }
    for (let taskId of this.elementsHandler.getAllModelTaskHandlers().map(a => a.task.id)) {
      this.canvas.removeMarker(taskId, 'highlight-dd-between');
    }
  }

}
