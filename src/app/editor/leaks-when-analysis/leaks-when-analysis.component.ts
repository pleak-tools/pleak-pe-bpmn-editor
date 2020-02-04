import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { ElementsHandler } from '../handler/elements-handler';

declare let $: any;
let is = (element, type) => element.$instanceOf(type);
declare function require(name: string);
const config = require('../../../config.json');

@Component({
  selector: 'app-leaks-when-analysis',
  templateUrl: './leaks-when-analysis.component.html',
  styleUrls: ['./leaks-when-analysis.component.less']
})
export class LeaksWhenAnalysisComponent {

  constructor(private authService: AuthService, private http: HttpClient) {
    this.authService.authStatus.subscribe(status => {
      this.authenticated = status;
    });
  }

  @Input() authenticated: Boolean;
  @Input() modelId: number;
  @Input() viewer: any;
  @Input() elementsHandler: ElementsHandler;
  @Input() activeMode: string;

  @Output() open = new EventEmitter();

  registry: any;
  eventBus: any;
  canvas: any;
  diagram: string;
  dtoOwners: any;

  analysisPanel: any;
  successPanel: any;

  private taskDtoOrdering: any = {};

  public SelectedTarget: any = {
    simplificationDto: null,
    r: null,
    c: null,
    selectedTargetForLeaksWhen: null
  };

  leaksWhenAnalysisInprogress: boolean = false;

  scriptOfSelectedElement: string = null;
  policyOfSelectedElement: string = null;

  BPMNLeaksWhenError: string = null;
  SQLLeaksWhenError: string = null;

  SQLLeaksWhenResult: any[] = [];
  BPMNLeaksWhenResult: any = null;

  init(): void {
    if (this.viewer) {
      this.registry = this.viewer.get('elementRegistry');
      this.canvas = this.viewer.get('canvas');
    }
  }

  canEdit(): boolean {
    return <boolean>this.elementsHandler.canEdit;
  }

  getSelectedElement(): any {
    if (this.elementsHandler && this.elementsHandler.selectedElement) {
      return this.elementsHandler.selectedElement;
    }
    return null;
  }

  openModal(value: string): void {
    let obj = JSON.parse(value);
    obj.name = this.getSelectedElement().businessObject.name ? this.getSelectedElement().businessObject.name : "";
    this.open.emit(JSON.stringify(obj));
  }

  setScript(script: string): void {
    this.scriptOfSelectedElement = script;
  }

  setPolicy(policy: string): void {
    this.policyOfSelectedElement = policy;
  }

  setScriptOrPolicy(value: string): void {
    let inputObj = JSON.parse(value);
    if (inputObj.type === "script") {
      this.setScript(inputObj.value);
    } else if (inputObj.type === "policy") {
      this.setPolicy(inputObj.value);
    }
  }

  isPEBPMModeActive(): boolean {
    return this.activeMode === "PEBPMN";
  }

  isBPMNLeaksWhenActive(): boolean {
    return this.activeMode === "BPMNleaks";
  }

  isSQLLeaksWhenActive(): boolean {
    return this.activeMode === "SQLleaks";
  }

  isSelectedElementScriptElement(): boolean {
    if (this.isBPMNLeaksWhenActive()) {
      return this.getSelectedElement() && this.getSelectedElement().type === "bpmn:Task";
    } else if (this.isSQLLeaksWhenActive()) {
      return this.getSelectedElement() && (
        this.getSelectedElement().type === "bpmn:Task" ||
        this.getSelectedElement().type === "bpmn:StartEvent" ||
        this.getSelectedElement().type === "bpmn:IntermediateCatchEvent" ||
        this.getSelectedElement().type === "bpmn:DataObjectReference" ||
        this.getSelectedElement().type === "bpmn:DataStoreReference"
      );
    }
  }

  isSelectedElementPolicyElement(): boolean {
    return this.getSelectedElement() && (
      this.getSelectedElement().type === "bpmn:Participant" ||
      (this.getSelectedElement().type === "bpmn:DataObjectReference" && this.getSelectedElement().incoming && this.getSelectedElement().incoming.length > 0) ||
      (this.getSelectedElement().type === "bpmn:DataStoreReference" && this.getSelectedElement().incoming && this.getSelectedElement().incoming.length > 0)
    );
  }

  clear(): void {
    this.checkForUnsavedLeaksWhenChanges();
  }

  save(): void {
    this.init();
    let savedScript = this.registry.get(this.getSelectedElement().id).businessObject.sqlScript;
    let savedPolicy = this.registry.get(this.getSelectedElement().id).businessObject.policyScript;
    let currentScript = this.scriptOfSelectedElement;
    let currentPolicy = this.policyOfSelectedElement;
    let scriptBoolean = !savedScript || currentScript === "" && savedScript.length > 0 || currentScript && currentScript.length > 0 && savedScript.toString() !== currentScript.toString();
    let policyBoolean = !savedPolicy || currentPolicy === "" && savedPolicy.length > 0 || currentPolicy && currentPolicy.length > 0 && savedPolicy.toString() !== currentPolicy.toString();
    if (scriptBoolean || policyBoolean) {
      if (scriptBoolean) {
        this.registry.get(this.getSelectedElement().id).businessObject.sqlScript = currentScript;
      }
      if (policyBoolean) {
        this.registry.get(this.getSelectedElement().id).businessObject.policyScript = currentPolicy;
      }
      this.viewer.saveXML(
        {
          format: true
        },
        (err: any, xml: string) => {
          this.elementsHandler.updateModelContentVariable(xml);
        }
      );
      this.scriptOfSelectedElement = null;
      this.policyOfSelectedElement = null;
    }
    this.elementsHandler.terminateElementsEditing();
  }

  areThereUnsavedLeaksWhenChanges(): boolean {
    let currentElement = this.getSelectedElement();
    if (currentElement) {
      let currentScriptInRegistry = this.registry.get(currentElement.id).businessObject.sqlScript;
      if ((this.scriptOfSelectedElement === "" || this.scriptOfSelectedElement && this.scriptOfSelectedElement.length > 0) && (currentScriptInRegistry && this.scriptOfSelectedElement.toString() !== currentScriptInRegistry.toString() || !currentScriptInRegistry)) {
        return true;
      }
      let currentPolicyInRegistry = this.registry.get(currentElement.id).businessObject.policyScript;
      if ((this.policyOfSelectedElement === "" || this.policyOfSelectedElement && this.policyOfSelectedElement.length > 0) && (currentPolicyInRegistry && this.policyOfSelectedElement.toString() !== currentPolicyInRegistry.toString() || !currentPolicyInRegistry)) {
        return true;
      }
    }
    return false;
  }

  checkForUnsavedLeaksWhenChanges(): boolean | void {
    this.init();
    if (this.areThereUnsavedLeaksWhenChanges()) {
      if (confirm('Are you sure you wish to revert unsaved settings?')) {
        this.scriptOfSelectedElement = null;
        this.policyOfSelectedElement = null;
        this.elementsHandler.terminateElementsEditing();
      } else {
        this.canvas.addMarker(this.getSelectedElement().id, 'selected');
        return false;
      }
    }
    this.scriptOfSelectedElement = null;
    this.policyOfSelectedElement = null;
    this.elementsHandler.terminateElementsEditing();
  }

  // Simple Disclosure leaks-when

  runSimpleDisclosureLeaksWhenAnalysis(): void {

    if (!this.isSQLLeaksWhenActive()) {
      this.elementsHandler.parent.setSQLLeaksWhenMode();
    }

    this.init();

    this.scriptOfSelectedElement = null;
    this.policyOfSelectedElement = null;
    this.elementsHandler.terminateElementsEditing();

    this.leaksWhenAnalysisInprogress = true;
    this.SQLLeaksWhenResult = [];

    this.SelectedTarget = {
      simplificationDto: null,
      r: null,
      c: null,
      selectedTargetForLeaksWhen: null
    };

    this.SelectedTarget.simplificationDto = this.getAllDataObjects().find(x => x.name.trim() == this.elementsHandler.SelectedTarget.name);
    this.SelectedTarget.c = this.elementsHandler.SelectedTarget.c;
    this.SelectedTarget.r = this.elementsHandler.SelectedTarget.r;

    if (!this.SelectedTarget.simplificationDto) {
      this.leaksWhenAnalysisInprogress = false;
      this.SQLLeaksWhenError = "Select at least one data object to run the analysis."
      return;
    }

    this.findOutputDtoForLeaksWhen();

    if (!this.SelectedTarget.selectedTargetForLeaksWhen) {
      this.leaksWhenAnalysisInprogress = false;
      this.SQLLeaksWhenError = "Unable to find output dataObject for the analysis."
      return;
    }

    if (this.SelectedTarget.simplificationDto) {
      const processedTarget = this.SelectedTarget.simplificationDto.name.trim();
      this.runLeaksWhenAnalysis(processedTarget, this.SelectedTarget.selectedTargetForLeaksWhen);
    } else {
      this.leaksWhenAnalysisInprogress = false;
      this.SQLLeaksWhenError = "Select at least one data object to run the analysis."
    }

  }

  getAllDataObjects(): any[] {
    let allDtos = [];
    for (var i in this.registry._elements) {
      var node = this.registry._elements[i].element;
      if (is(node.businessObject, 'bpmn:DataObjectReference')) {
        if (!allDtos.find(x => x.id == node.businessObject.id))
          allDtos.push(node.businessObject);
      }
    }
    return allDtos;
  }

  handleMessageFlows(): any[] {
    let rolesDisclosures = {};
    let maxPlaceNumberObj = { maxPlaceNumber: 1 };
    for (let i in this.registry._elements) {
      if (this.registry._elements[i].element.type == "bpmn:StartEvent") {
        this.orderLaneDtos(this.registry._elements[i].element.businessObject, maxPlaceNumberObj);
      }
    }

    let messageFlows = [];
    let roles = this.getParticipantsInfo();

    let participants = [];
    for (var i in this.registry._elements) {
      if (this.registry._elements[i].element.type == "bpmn:Participant") {
        let curPart = this.registry._elements[i].element;
        participants.push({ name: curPart.businessObject.name, dtos: [] });

        for (var j = 0; j < curPart.children.length; j++) {
          if ((is(curPart.children[j].businessObject, 'bpmn:DataObjectReference') ||
            is(curPart.children[j].businessObject, 'bpmn:Task') ||
            is(curPart.children[j].businessObject, 'bpmn:StartEvent') ||
            is(curPart.children[j].businessObject, 'bpmn:IntermediateCatchEvent')) &&
            curPart.children[j].businessObject) {
            participants[participants.length - 1].dtos.push(curPart.children[j].businessObject);
            curPart.children[j].businessObject.participant = curPart;
          }
        }
      }
    }

    for (var i in this.registry._elements) {
      var node = this.registry._elements[i].element;
      if (node.type == "bpmn:MessageFlow") {
        var source = node.businessObject.sourceRef;
        var target = node.businessObject.targetRef;
        var targetOutputDto = target.dataOutputAssociations[0].targetRef;
        var outputLane = roles[0];

        messageFlows.push({ source: source, target: target });

        for (let j = 0; j < roles.length; j++) {
          let isOuputDtoFound = false;
          for (let k = 0; k < roles[j].dataObjects.length; k++) {
            if (roles[j].dataObjects[k].id == targetOutputDto.id) {
              isOuputDtoFound = true;
              outputLane = roles[j];
              break;
            }
          }
          if (isOuputDtoFound) {
            break;
          }
        }

        if (!rolesDisclosures[outputLane.label])
          rolesDisclosures[outputLane.label] = {};

        let parentLane = participants.find(x => !!x.dtos.find(y => y.orderingIndex == source.orderingIndex));
        parentLane.dtos.filter(x => x.orderingIndex < source.orderingIndex).forEach(x => x.visibility = "I");

        // Direct disclosures are data objects that attached as an input to the task with message flow
        source.dataInputAssociations.forEach(x => {
          let dto = x.sourceRef[0];

          for (let j = 0; j < roles.length; j++) {
            let isInputDtoFound = false;
            for (let k = 0; k < roles[j].dataObjects.length; k++) {
              if (roles[j].dataObjects[k].id == dto.id) {
                isInputDtoFound = true;
                break;
              }
            }
            if (!isInputDtoFound) {
              rolesDisclosures[outputLane.label][dto.name] = 'V';
              break;
            }
          }
        });
      }
    }

    return messageFlows;
  }

  orderLaneDtos(startBusinessObj: any, maxPlaceNumberObj: any): void {
    let currentRun = [];
    let st = [startBusinessObj];
    let xorSplitStack = [];

    while (st.length > 0) {
      let curr = st.pop();
      if (!curr.orderingIndex)
        curr.orderingIndex = maxPlaceNumberObj.maxPlaceNumber++;
      currentRun.push(curr);

      let inc = curr.incoming ? curr.incoming.map(x => x.sourceRef) : null;
      let out = curr.outgoing ? curr.outgoing.map(x => x.targetRef) : null;

      if (curr.outgoing && curr.incoming && !curr.isProcessed) {
        var ident = curr.id;
        if (curr.$type == "bpmn:ParallelGateway") {
          ident = ident.replace("Exclusive", "Parallel");
        }

        curr.isProcessed = curr.incoming.reduce((acc, cur) => {
          return acc && !!cur.petriPlace;
        }, true);
      }

      var isAllPredecessorsInRun = !inc || inc.reduce((acc, cur) => acc && !!currentRun.find(x => x == cur), true);
      if (isAllPredecessorsInRun || curr.$type == 'bpmn:ExclusiveGateway' && out.length == 1 ||
        curr.$type == 'bpmn:EndEvent') {
        if (!!curr.stackImage) {
          // Cycle check
          continue;
        }
        if (curr.$type == 'bpmn:ExclusiveGateway' && inc.length == 1) {
          curr.stackImage = st.slice();
          xorSplitStack.push(curr);
          out.forEach(x => st.push(x));
        }
        else {
          if (curr.$type != 'bpmn:EndEvent') {
            out.forEach(x => st.push(x));
          }
        }
      }
    }

    // Data Objects handling
    for (var i in this.registry._elements) {
      var node = this.registry._elements[i].element;
      if ((is(node.businessObject, 'bpmn:Task') || is(node.businessObject, 'bpmn:IntermediateCatchEvent'))) {
        if (node.businessObject.dataInputAssociations && node.businessObject.dataInputAssociations.length) {
          node.businessObject.dataInputAssociations.forEach(x => {
            if (!x.sourceRef[0].orderingIndex)
              x.sourceRef[0].orderingIndex = node.businessObject.orderingIndex;
          });
        }
      }
    }
  }

  findOutputDtoForLeaksWhen(): void {
    let nextMessageFlows = this.handleMessageFlows()
      .filter(x => (x.source.participant.id == this.SelectedTarget.simplificationDto.participant.id) &&
        x.source.orderingIndex >= this.SelectedTarget.simplificationDto.orderingIndex);
    nextMessageFlows = nextMessageFlows.sort((a, b) => a.source.orderingIndex - b.source.orderingIndex);

    if (nextMessageFlows.length) {
      let nextMessageFlow = nextMessageFlows[0];
      let outputDtos = this.getAllDataObjects().filter(x => x.name != 'parameters' && (x.participant.id == nextMessageFlow.target.participant.id) &&
        (x.orderingIndex >= nextMessageFlow.target.orderingIndex));
      outputDtos = outputDtos.sort((a, b) => a.orderingIndex - b.orderingIndex);
      if (outputDtos.length) {
        let outputDto = outputDtos[0];
        this.SelectedTarget.selectedTargetForLeaksWhen = outputDto;
      }
    }
  }


  // BPMN leaks-when

  runBPMNLeaksWhenAnalysis(): void {
    this.init();
    this.scriptOfSelectedElement = null;
    this.policyOfSelectedElement = null;
    this.elementsHandler.terminateElementsEditing();
    if (this.viewer) {
      this.sendBPMNLeaksWhenAnalysisRequest();
    } else {
      this.BPMNLeaksWhenError = "Unable to analyse the model. Make sure the model file is not empty or corrupt.";
    }
  }

  sendBPMNLeaksWhenAnalysisRequest(): void {
    if (this.BPMNLeaksWhenResult && !this.areThereUnsavedLeaksWhenChanges() && !this.elementsHandler.areThereUnsavedChangesOnModel()) {
      this.showBPMNLeaksWhenAnalysisResults(this.BPMNLeaksWhenResult);
    } else {
      this.leaksWhenAnalysisInprogress = true;
      this.viewer.saveXML(
        {
          format: true
        },
        (err: any, xml: string) => {
          if (err) {
            this.leaksWhenAnalysisInprogress = false;
            this.BPMNLeaksWhenError = "Unable to analyse the model. Make sure the model file is not corrupt.";
            console.log(err);
          } else {
            this.BPMNLeaksWhenError = null;
            this.http.post(config.backend.host + '/rest/sql-privacy/analyze-leaks-when', { model: xml }, AuthService.loadRequestOptions()).subscribe(
              (response: any) => {
                this.BPMNLeaksWhenResult = JSON.parse(response.result);
                this.showBPMNLeaksWhenAnalysisResults(this.BPMNLeaksWhenResult);
                this.BPMNLeaksWhenError = null;
              },
              () => {
                this.leaksWhenAnalysisInprogress = false;
                this.BPMNLeaksWhenResult = null;
                this.BPMNLeaksWhenError = "Unable to analyse the model. Make sure the model and all input scripts are correct.";
              }
            );
          }
        });
    }
  }

  showBPMNLeaksWhenAnalysisResults(response: any): void {
    const $modal = $('#bpmnLeaksWhenModal');

    $modal.find('.modal-body').html(
      `<table>
          <thead>
          </thead>
          <tbody>
          </tbody>
        </table>`
    );

    $modal.find('table thead').html(() => {
      let output = `<th></th>`;

      response.inputs.forEach((item) => {
        output += `<th><div><span>${item}</span></div></th>`;
      });

      return `<tr>${output}</tr>`;
    });

    $modal.find('table tbody').html(() => {
      let output = '';

      response.outputs.forEach((item) => {
        const realKey = Object.keys(item)[0];
        const realItem = item[realKey];
        output += `<tr><th>${realKey}</th>`;

        realItem.forEach((rowValue) => {
          const realValue = Object.keys(rowValue)[0];
          if (realValue === 'if') {
            output += `<td class="${realValue}" data-toggle="tooltip" data-container="body" title="${rowValue[realValue]}">${realValue}</td>`;
          } else {
            output += `<td class="${realValue}">${realValue}</td>`;
          }
        });

        output += '</tr>';
      });

      return output;
    });

    $modal.find('table tbody td').hover(
      () => {
        const $output = $(this).closest('table').find('thead th').eq($(this).index());
        const $input = $('th:first', $(this).parents('tr'));

        $output.addClass('highlighted');
        $input.addClass('highlighted');
      }, () => {
        const $output = $(this).closest('table').find('thead th').eq($(this).index());
        const $input = $('th:first', $(this).parents('tr'));

        $output.removeClass('highlighted');
        $input.removeClass('highlighted');
      });

    $modal.find('.modal-header').on('mousedown', (event) => {
      const startX = event.pageX;
      const startY = event.pageY;

      const $modalheader = $(this);
      const $modalContainer = $modalheader.closest('.modal-dialog');

      const modalX = parseInt($modalContainer.css('transform').split(',')[4]);
      const modalY = parseInt($modalContainer.css('transform').split(',')[5]);

      $modalheader.css('cursor', 'move');
      $modal.css('opacity', 0.3);

      const moveFunction = (e) => {
        const diffX = e.pageX - startX;
        const diffY = e.pageY - startY;

        $modalContainer.css('transform', `translate(${diffX + modalX}px, ${diffY + modalY}px)`);
      };

      $(document).on('mousemove', moveFunction);
      $(document).on('mouseup', () => {
        $(document).off('mousemove', moveFunction);
        $modal.css('opacity', 1);
      });
    });

    $('[data-toggle="tooltip"]', $modal).tooltip();
    this.leaksWhenAnalysisInprogress = false;
    $modal.modal();
  }

  // SQL leaks-when

  runSQLLeaksWhenAnalysis(): void {
    this.init();
    this.scriptOfSelectedElement = null;
    this.policyOfSelectedElement = null;
    this.elementsHandler.terminateElementsEditing();
    if (this.viewer) {
      this.leaksWhenAnalysisInprogress = true;
      this.SQLLeaksWhenResult = [];
      this.runLeaksWhenAnalysis();
    } else {
      this.leaksWhenAnalysisInprogress = false;
      this.SQLLeaksWhenError = "Unable to analyse the model. Make sure the model file is not empty or corrupt.";
    }
  }

  runLeaksWhenAnalysis(simplificationTarget: any = null, outputTarget: any = null): void {
    if (!this.elementsHandler.selectedDataObjects.length && !outputTarget) {
      this.leaksWhenAnalysisInprogress = false;
      this.SQLLeaksWhenError = "Select at least one data object to run the analysis."
    } else {
      this.SQLLeaksWhenError = null;
      this.viewer.saveXML({ format: true }, (err: any, xml: string) => {
        if (err) {
          this.leaksWhenAnalysisInprogress = false;
          this.SQLLeaksWhenError = "Unable to analyse the model. Make sure the model file is not corrupt.";
          console.log(err);
        } else {
          this.viewer.get('moddle').fromXML(xml, () => {

            const startBpmnEvents = [];
            for (const i in this.registry._elements) {
              if (this.registry._elements[i].element.type === 'bpmn:StartEvent') {
                startBpmnEvents.push(this.registry._elements[i].element.businessObject);
              }
            }

            if (!!startBpmnEvents) {
              let petriNet = {};
              const maxPlaceNumberObj = { maxPlaceNumber: 0 };
              // For multiple lanes we have multiple start events
              for (let i = 0; i < startBpmnEvents.length; i++) {
                petriNet = this.buildPetriNet(startBpmnEvents[i], petriNet, maxPlaceNumberObj, this.taskDtoOrdering);
              }

              this.preparePetriNetForServer(petriNet);

              const matcher = {};
              Object.keys(petriNet).forEach(k => {
                petriNet[k]['id'] = k;

                const obj = this.registry.get(k);
                if (!!obj && obj.businessObject.sqlScript) {
                  matcher[k] = obj.businessObject.sqlScript;
                }
              });
              const petriNetArray = Object.values(petriNet);
              this.removePetriMarks();

              const modelId = this.modelId;
              const modelName = $('#fileName').text().substring(0, $('#fileName').text().length - 5);

              const serverPetriFileName = modelId + '_' + modelName;
              const participants = this.groupPoliciesByParticipants();

              this.sendPreparationRequest(serverPetriFileName, JSON.stringify(petriNetArray), matcher, (outputTarget ? [outputTarget] : this.elementsHandler.selectedDataObjects), this.taskDtoOrdering, participants, simplificationTarget)
                .then(
                  () => {
                    this.leaksWhenAnalysisInprogress = false;
                    this.SQLLeaksWhenError = null;
                  },
                  () => {
                    this.leaksWhenAnalysisInprogress = false;
                    this.SQLLeaksWhenError = "Unable to analyse the model. Make sure the model and all input scripts are correct."
                  });
            }
          });
        }
      });
    }
  }

  sendPreparationRequest(diagramId, petri, matcher, selectedDataObjects, taskDtoOrdering, participants, simplificationTarget): any {
    return this.http.post(config.leakswhen.host + config.leakswhen.compute, { diagram_id: diagramId, petri: petri })
      .toPromise()
      .then(
        (res: any) => {
          let runs = res.runs;

          runs = runs.filter(run => {
            return run.reduce((acc, cur) => acc || cur.includes('EndEvent'), false);
          });

          return runs.reduce((acc, run, runNumber) => acc.then(() => {
            const sqlCommands = run.reduce((acc, id) => acc + (matcher[id] ? matcher[id] + '\n' : ''), '');

            return selectedDataObjects.reduce((acc, currentOutputDto) => acc.then(() => {
              // We select participant that contains selected data object
              const currentParticipant = participants.filter(x => !!x.policies.find(p => p.name == currentOutputDto.id))[0];
              const orderedDtos = {};
              let currentOrderingIndex = 0;

              // We should take policies only from those data objects that topologically preceed selected one
              for (let i = 0; i < run.length; i++) {
                if (run[i].indexOf('Task') != -1) {
                  for (let j = 0; j < taskDtoOrdering[run[i]].length; j++) {
                    if (run.indexOf(taskDtoOrdering[run[i]][j]) == -1) {
                      orderedDtos[taskDtoOrdering[run[i]][j]] = currentOrderingIndex;
                    }
                  }
                } else {
                  orderedDtos[run[i]] = currentOrderingIndex;
                }
                currentOrderingIndex++;
              }

              const indexOfOutputDto = orderedDtos[currentOutputDto.id];
              const requestPolicies = currentParticipant
                ? currentParticipant.policies.filter(x => (orderedDtos[x.name] <= indexOfOutputDto || x.name == 'laneScript') && !!x.script)
                : [];
              const processedOutputDto = currentOutputDto.name.split(' ').map(word => word.toLowerCase()).join('_');

              return this.sendLeaksWhenRequest(diagramId, sqlCommands, [processedOutputDto], requestPolicies.map(x => x.script), runNumber, simplificationTarget, currentOutputDto.name ? currentOutputDto.name : "<unnamed>");
            }), Promise.resolve());
          }), Promise.resolve());
        });
  }

  sendLeaksWhenRequest(diagramId, sqlCommands, processedLabels, policy, runNumber, simplificationTarget, selectedDataObjectName) {
    const modelPath = `${diagramId}/run_${runNumber}/${processedLabels[0]}`;
    return this.http.post(config.leakswhen.host + config.leakswhen.report, { diagram_id: diagramId, simplificationTarget: simplificationTarget, run_number: runNumber, selected_dto: processedLabels[0], model: modelPath, targets: processedLabels.join(','), sql_script: sqlCommands, policy: policy })
      .toPromise()
      .then(
        (res: any) => {
          const files = res.files;
          const legend = files.filter(x => x.indexOf('legend') != -1)[0];
          const namePathMapping = {};
          files.filter(x => x.indexOf('legend') == -1).forEach(path => namePathMapping[path.split('/').pop()] = path);

          // const leaksWhenLegendUrl = config.leakswhen.host + legend.replace("leaks-when/", "");
          const leaksWhenLegendUrl = config.leakswhen.host + legend;
          return this.http.get(leaksWhenLegendUrl)
            .toPromise()
            .then((legendObject: any) => {
              let resultObject = { name: selectedDataObjectName, links: [], input: simplificationTarget ? simplificationTarget : "" };
              let linksObject = legendObject[Object.keys(legendObject)[0]];
              for (let link of linksObject) {
                let viewUrl = config.frontend.host + namePathMapping[link].replace("leaks-when/data", "graph2").split('.')[0]; // TODO - change to "graph"
                let downloadUrl = config.frontend.host + namePathMapping[link].replace("leaks-when/", "pleak-leaks-when-ast-transformation/");
                resultObject.links.push({ view: viewUrl, download: downloadUrl });
              }
              this.SQLLeaksWhenResult.push(resultObject);
            });
        }
      );
  }


  /* PETRINETS */


  // To refresh the state of diagram and be able to run analyser again
  removePetriMarks(): void {
    for (var i in this.registry._elements) {
      var node = this.registry._elements[i].element;
      if (node['petriPlace']) {
        delete node['petriPlace'];
      }
      if (node['isProcessed']) {
        delete node['isProcessed'];
      }
      if (node['stackImage']) {
        delete node['stackImage'];
      }
      if (!!node.businessObject) {
        if (node.businessObject['petriPlace']) {
          delete node.businessObject['petriPlace'];
        }
        if (node.businessObject['isProcessed']) {
          delete node.businessObject['isProcessed'];
        }
        if (node.businessObject['stackImage']) {
          delete node.businessObject['stackImage'];
        }
      }
    }
  }

  buildPetriNet(startBusinessObj, petri, maxPlaceNumberObj, taskDtoOrdering): any {
    let currentRun = [];
    let st = [startBusinessObj];
    let xorSplitStack = [];

    while (st.length > 0) {
      let curr = st.pop();
      currentRun.push(curr);

      let inc = curr.incoming ? curr.incoming.map(x => x.sourceRef) : null;
      let out = curr.outgoing ? curr.outgoing.map(x => x.targetRef) : null;

      if (curr.outgoing && curr.$type != "bpmn:DataObjectReference") {
        curr.outgoing.forEach(x => {
          var name = curr.id;
          if (!is(curr, 'bpmn:StartEvent')) {
            name = x.petriPlace ? x.petriPlace : "p" + maxPlaceNumberObj.maxPlaceNumber++;
          }

          if (is(x.targetRef, 'bpmn:EndEvent')) {
            name = x.targetRef.id;
          }

          x.petriPlace = name;

          if (!petri[name]) {
            petri[name] = { out: [], type: "place" };
          }
        });
      }

      if (curr.$type == "bpmn:DataObjectReference") {
        petri[curr.id] = {
          out: out.length ? out.map(x => x.id) : [],
          type: "place"
        };
      }

      if (curr.outgoing && curr.incoming && !curr.isProcessed) {
        var ident = curr.id;
        if (curr.$type == "bpmn:ParallelGateway") {
          ident = ident.replace("Exclusive", "Parallel");
        }

        if (!petri[ident]) {
          petri[ident] = {
            out: curr.outgoing.map(x => x.petriPlace),
            type: "transition"
          };
        }
        else {
          petri[ident].out = petri[ident].out.concat(curr.outgoing.map(x => x.petriPlace));
        }

        curr.incoming.forEach(x => {
          if (x.petriPlace && !petri[x.petriPlace].out.find(z => z == ident)) {
            petri[x.petriPlace].out.push(ident);
          }
        });

        curr.isProcessed = curr.incoming.reduce((acc, cur) => {
          return acc && !!cur.petriPlace;
        }, true);
      }

      var isAllPredecessorsInRun = !inc || inc.reduce((acc, cur) => acc && !!currentRun.find(x => x == cur), true);
      if (isAllPredecessorsInRun || curr.$type == 'bpmn:ExclusiveGateway' && out.length == 1 ||
        curr.$type == 'bpmn:EndEvent') {
        if (!!curr.stackImage) {
          // Cycle check
          continue;
        }
        if (curr.$type == 'bpmn:ExclusiveGateway' && inc.length == 1) {
          curr.stackImage = st.slice();
          xorSplitStack.push(curr);
          out.forEach(x => st.push(x));
        }
        else {
          if (curr.$type != 'bpmn:EndEvent') {
            out.forEach(x => st.push(x));
          }
        }
      }
    }

    // Data Objects handling
    for (var i in this.registry._elements) {
      var node = this.registry._elements[i].element;
      if ((is(node.businessObject, 'bpmn:Task') || is(node.businessObject, 'bpmn:IntermediateCatchEvent')) && petri[node.id]) {
        taskDtoOrdering[node.id] = [];
        petri[node.id].label = node.businessObject.name;

        if (node.businessObject.dataInputAssociations && node.businessObject.dataInputAssociations.length) {
          node.businessObject.dataInputAssociations.forEach(x => {
            // We attach initial data objects with 'create' statements to the first
            // task of current lane and ignore if there are multiple output associations
            // because of petri net logic
            var isFoundInputForDTO = false;
            for (var j in this.registry._elements) {
              var node2 = this.registry._elements[j].element;
              if (is(node2.businessObject, 'bpmn:Task') || is(node2.businessObject, 'bpmn:IntermediateCatchEvent')) {
                if (node2.businessObject.dataOutputAssociations && node2.businessObject.dataOutputAssociations.length) {
                  node2.businessObject.dataOutputAssociations.forEach(y => {
                    if (y.targetRef.id == x.sourceRef[0].id)
                      isFoundInputForDTO = true;
                  });
                }
              }
            }

            if (!!x.sourceRef[0].sqlScript && !x.sourceRef[0].isPropagated && !isFoundInputForDTO && x.sourceRef[0].$parent.id == startBusinessObj.$parent.id) {
              let startEventOut = startBusinessObj.outgoing ? startBusinessObj.outgoing.map(x => x.targetRef) : null;
              if (!!startEventOut) {
                petri[x.sourceRef[0].id] = { type: "place", out: [startEventOut[0].id], label: x.sourceRef[0].name }
              }
            }
          });
        }

        if (node.businessObject.dataOutputAssociations && node.businessObject.dataOutputAssociations.length) {
          node.businessObject.dataOutputAssociations.forEach(x => {
            if (!!x.targetRef.sqlScript && !x.targetRef.isPropagated) {
              if (petri[node.id].out.findIndex(y => y == x.targetRef.id) == -1)
                petri[node.id].out.push(x.targetRef.id);
              if (!petri[x.targetRef.id]) {
                petri[x.targetRef.id] = { type: "place", out: [], label: x.targetRef.name }
              }
            }

            taskDtoOrdering[node.id].push(x.targetRef.id);
          });
        }
      }
    }

    // Handling message flow
    for (var i in this.registry._elements) {
      var node = this.registry._elements[i].element;
      if (node.type == "bpmn:MessageFlow" && !node.isProcessed) {
        var source = node.businessObject.sourceRef;
        var target = node.businessObject.targetRef;

        // New place for message flow
        var newId = "";
        // In case of message flow to start event in another lane
        // we don't need a new place, because start event is already a place
        if (is(target, 'bpmn:StartEvent')) {
          newId = target.id;
        }
        else {
          newId = "p" + maxPlaceNumberObj.maxPlaceNumber++;
          petri[newId] = { type: "place", out: [target.id], label: newId }
        }

        if (!petri[source.id]) {
          petri[source.id] = { type: "transition", out: [newId], label: source.name }
        }
        else {
          petri[source.id].out.push(newId);
        }

        node.isProcessed = true;
      }
    }

    return petri;
  }

  preparePetriNetForServer(petriNet: any): void {
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    for (var el in petriNet) {
      petriNet[el].out = petriNet[el].out.filter(onlyUnique);
    }

    // Removing redundant nodes before/after xor gateway 
    // (because XOR state is not carrying logic so we can connect preceeding node directly to the following)
    for (var el in petriNet) {
      if (el.includes("ExclusiveGateway")) {
        var copies = 0;

        if (petriNet[el].out.length > 1) {

          var preceedingNode = Object.values(petriNet).find(x => !!x["out"].find(z => z == el));
          preceedingNode["out"] = [];
          for (var i = 0; i < petriNet[el].out.length; i++) {
            copies++;
            var copy = el + i;
            preceedingNode["out"].push(copy);
            petriNet[copy] = { type: petriNet[el].type, out: [petriNet[el].out[i]] };
          }
        }
        else {
          var preceedings = Object.values(petriNet).filter(x => !!x["out"].find(z => z == el));
          for (var i = 0; i < preceedings.length; i++) {
            copies++;
            var copy = el + i;
            preceedings[i]["out"] = [copy];
            petriNet[copy] = { type: petriNet[el].type, out: [petriNet[el].out[0]] };
          }
        }

        delete petriNet[el];

      }
    }

    // Additional data for server analyzer
    for (var el in petriNet) {
      if (petriNet[el].type == "place") {
        var isInputFound = false;
        for (var el2 in petriNet) {
          if (petriNet[el2].out.findIndex(x => x == el) != -1) {
            isInputFound = true;
            break;
          }
        }

        petriNet[el].isInputFound = isInputFound;
      }
    }

  }


  /* POLICIES */

  groupPoliciesByParticipants(): any[] {
    let participants = [];

    for (var i in this.registry._elements) {
      if (this.registry._elements[i].element.type == "bpmn:Participant") {
        let curPart = this.registry._elements[i].element;
        participants.push({ name: curPart.id, policies: [] });
        if (curPart.businessObject.policyScript) {
          participants[participants.length - 1].policies.push({ name: 'laneScript', script: curPart.businessObject.policyScript });
        }

        for (var j = 0; j < curPart.children.length; j++) {
          if (curPart.children[j].type == "bpmn:DataObjectReference" && curPart.children[j].businessObject) {
            participants[participants.length - 1].policies.push({
              name: curPart.children[j].businessObject.id,
              script: (curPart.children[j].businessObject.policyScript ? curPart.children[j].businessObject.policyScript : "")
            });
          }
        }
      }
    }

    return participants;
  }

  getParticipantsInfo(): any[] {
    let participants = [];

    for (var i in this.registry._elements) {
      if (this.registry._elements[i].element.type == "bpmn:Participant") {
        let curPart = this.registry._elements[i].element;
        participants.push({ id: curPart.id, dataObjects: [] });
        for (var j = 0; j < curPart.children.length; j++) {
          if (curPart.children[j].type == "bpmn:DataObjectReference" && curPart.children[j].businessObject) {
            participants[participants.length - 1].dataObjects.push({
              id: curPart.children[j].businessObject.id,
            });
          }
        }
      }
    }

    if (!participants.length) {
      let processRole = $('#fileName')[0].innerText.replace('.bpmn', '');
      participants.push({ id: processRole, dataObjects: [] });
      for (var i in this.registry._elements) {
        let elem = this.registry._elements[i].element;
        if (elem.type == "bpmn:DataObjectReference" && elem.businessObject) {
          participants[0].dataObjects.push({
            id: elem.businessObject.id,
          });
        }
      }
    }

    return participants;
  }

  getPolicyRoles(): any[] {
    this.init();
    let laneRoles = [];
    let processRole = $('#fileName')[0].innerText.replace('.bpmn', '');

    // First we try to find BPMN lanes
    // If not any, then we take process name as the only role
    for (var i in this.registry._elements) {
      if (this.registry._elements[i].element.type === "bpmn:Participant") {
        laneRoles.push(this.registry._elements[i].element.businessObject.name);
      }
    }

    return laneRoles.length ? laneRoles : [processRole];
  }

}