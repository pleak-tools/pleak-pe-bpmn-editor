import * as Viewer from 'bpmn-js/lib/NavigatedViewer';

import { ValidationErrorObject, ValidationHandler } from "../handler/validation-handler";
import { TaskHandler } from "../handler/task-handler";
import { Stereotype } from "./stereotype";

export interface TaskStereotypeGroupObject {
  groupId: String;
  taskId: String;
}

export class TaskStereotype extends Stereotype {

  constructor(title: String, taskHandler: TaskHandler) {
    super(title, taskHandler);

    this.task = taskHandler.task;
    this.taskHandler = taskHandler;
    this.validationHandler = taskHandler.validationHandler;
  }

  task: any;
  taskHandler: TaskHandler;
  validationHandler: ValidationHandler;

  /** Functions for all subclasses (stereotypes) */
  getTaskInputObjectsByTaskId(taskId: String) {
    return this.getTaskHandlerByTaskId(taskId).getTaskInputObjects()
  }

  getTaskOutputObjectsByTaskId(taskId: String) {
    return this.getTaskHandlerByTaskId(taskId).getTaskOutputObjects();
  }

  /** Wrappers to access taskHandler functions */
  getTaskHandlerByTaskId(taskId: String) {
    return this.taskHandler.getTaskHandlerByTaskId(taskId);
  }

  getMessageFlowHandlerByMessageFlowId(messageFlowId: String) {
    return this.taskHandler.getMessageFlowHandlerByMessageFlowId(messageFlowId);
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

  addStereotypeToTheListOfGroupStereotypesOnModel(stereotype: String) {
    this.taskHandler.addStereotypeToTheListOfGroupStereotypesOnModel(stereotype);
  }

  areGroupsTasksInSameOrderOnAllPoolsAndLanes() {
    return this.taskHandler.areGroupsTasksInSameOrderOnAllPoolsAndLanes();
  }

  getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes() {
    return this.taskHandler.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
  }

  getAllTaskStereotypeInstances() {
    return this.taskHandler.getAllTaskStereotypeInstances();
  }

  getDataObjectVisibilityStatus(dataObjectId: String) {}

  /** Wrappers to access validationHandler functions */

  isInteger(value: any) {
    return this.validationHandler.isInteger(value);
  }

  areNamesUnique(array: any[]) {
    return this.validationHandler.areNamesUnique(array);
  }

  areTasksParallel(taskIds: String[]) {
    return this.validationHandler.areTasksParallel(taskIds);
  }

  areAllGroupTasksAccesible() {
    return this.validationHandler.areAllGroupTasksAccesibleForTask(this.task.id);
  }

  getTaskOutputObjectsBasedOnTaskStereotype(taskId: String) {
    return this.validationHandler.getTaskOutputObjectsBasedOnTaskStereotype(taskId);
  }

  isOneOfInputObjectsInTaskStereotypeOutputs(taskId: String, inputObjects: any[]) {
    return this.validationHandler.isOneOfInputObjectsInTaskStereotypeOutputs(taskId, inputObjects);
  }

  taskHasInputElement(elementId: String) {
    return this.validationHandler.taskHasInputElement(this.task.id, elementId);
  }

  taskHasOutputElement(elementId: String) {
    return this.validationHandler.taskHasOutputElement(this.task.id, elementId);
  }

  getTasksOfIncomingPath() {
    return this.taskHandler.getTasksOfIncomingPath();
  }

  getTasksOfOutgoingPath() {
    return this.validationHandler.getTasksOfOutgoingPathByInputElement(this.task);
  }

  taskIsInIncomingPath(taskId: String) {
    return this.validationHandler.taskIsInIncomingPathOfTask(taskId, this.task.id);
  }

  taskIsInOutgoingPath(taskId: String) {
    return this.validationHandler.taskIsInOutgoingPathOfTask(taskId, this.task.id);
  }

  taskHasStereotype(task: any, stereotype: String) {
    return this.validationHandler.taskHasStereotype(task, stereotype);
  }

  isThereAtLeastOneStartEventInCurrentTaskProcess() {
    return this.validationHandler.isThereAtLeastOneStartEventInCurrentTaskProcess(this.task);
  }

}