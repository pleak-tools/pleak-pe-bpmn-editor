import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { TaskHandler } from "../handler/task-handler";
import { Stereotype } from "./stereotype";

export class TaskStereotype extends Stereotype {

  constructor(title: String, taskHandler: TaskHandler) {
    super(title, taskHandler);

    this.task = taskHandler.task;
    this.taskHandler = taskHandler;
  }

  task: any;
  taskHandler: TaskHandler;

  /** Functions for all subclasses (stereotypes) */
  getTaskInputObjectsByTaskId(taskId: String) {
    return this.getTaskHandlerByTaskId(taskId).getTaskInputObjects()
  }

  getTaskOutputObjectsByTaskId(taskId: String) {
    return this.getTaskHandlerByTaskId(taskId).getTaskOutputObjects();
  }

  /** Wrappers to access taskHandler functions*/
  getTaskHandlerByTaskId(taskId: String) {
    return this.taskHandler.getTaskHandlerByTaskId(taskId);
  }

  getTaskInputObjects() {
    return this.taskHandler.getTaskInputObjects();
  }

  getTaskOutputObjects() {
    return this.taskHandler.getTaskOutputObjects();
  }

  getTaskInputOutputObjects() {
    return this.taskHandler.getTaskInputOutputObjects();
  }

  highlightTaskInputAndOutputObjects() {
    this.taskHandler.highlightTaskInputAndOutputObjects();
  }

  removeTaskInputsOutputsHighlights() {
    this.taskHandler.removeTaskInputsOutputsHighlights();
  }

}