import { ValidationHandler } from "../handler/validation-handler";
import { TaskHandler } from "../handler/task-handler";
import { Stereotype } from "./stereotype";

export interface TaskStereotypeGroupObject {
  groupId: string;
  taskId: string;
}

export class TaskStereotype extends Stereotype {

  constructor(title: string, taskHandler: TaskHandler) {
    super(title, taskHandler);

    this.task = taskHandler.task;
    this.taskHandler = taskHandler;
    this.validationHandler = taskHandler.validationHandler;
  }

  task: any;
  taskHandler: TaskHandler;
  validationHandler: ValidationHandler;

  /** Functions for all subclasses (stereotypes) */
  getTaskInputObjectsByTaskId(taskId: string) {
    return this.getTaskHandlerByTaskId(taskId).getTaskInputObjects()
  }

  getTaskOutputObjectsByTaskId(taskId: string) {
    return this.getTaskHandlerByTaskId(taskId).getTaskOutputObjects();
  }

  /** Wrappers to access taskHandler functions */
  getTaskHandlerByTaskId(taskId: string) {
    return this.taskHandler.getTaskHandlerByTaskId(taskId);
  }

  getMessageFlowHandlerByMessageFlowId(messageFlowId: string) {
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

  addStereotypeToTheListOfGroupStereotypesOnModel(stereotype: string) {
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

  getDataObjectVisibilityStatus(dataObjectId: string): string[] { return []; }

  /** Wrappers to access validationHandler functions */

  isInteger(value: any) {
    return this.validationHandler.isInteger(value);
  }

  areNamesUnique(array: any[]) {
    return this.validationHandler.areNamesUnique(array);
  }

  areTasksParallel(taskIds: string[]) {
    return this.validationHandler.areTasksParallel(taskIds);
  }

  areAllGroupTasksAccesible() {
    return this.validationHandler.areAllGroupTasksAccesibleForTask(this.task.id);
  }

  getTaskOutputObjectsBasedOnTaskStereotype() {
    return this.taskHandler.getTaskOutputObjectsBasedOnTaskStereotype();
  }

  isOneOfInputObjectsInTaskStereotypeOutputs(taskId: string, inputObjects: any[]) {
    return this.validationHandler.isOneOfInputObjectsInTaskStereotypeOutputs(taskId, inputObjects);
  }

  taskHasInputElement(elementId: string) {
    return this.validationHandler.taskHasInputElement(this.task.id, elementId);
  }

  taskHasOutputElement(elementId: string) {
    return this.validationHandler.taskHasOutputElement(this.task.id, elementId);
  }

  getTasksOfIncomingPath() {
    return this.taskHandler.getTasksOfIncomingPath();
  }

  getTasksOfOutgoingPath() {
    return this.validationHandler.getTasksOfOutgoingPathByInputElement(this.task);
  }

  taskIsInIncomingPath(taskId: string) {
    return this.validationHandler.taskIsInIncomingPathOfTask(taskId, this.task.id);
  }

  taskIsInOutgoingPath(taskId: string) {
    return this.validationHandler.taskIsInOutgoingPathOfTask(taskId, this.task.id);
  }

  taskHasStereotype(task: any, stereotype: string) {
    return this.validationHandler.taskHasStereotype(task, stereotype);
  }

  isThereAtLeastOneStartEventInCurrentTaskProcess() {
    return this.validationHandler.isThereAtLeastOneStartEventInCurrentTaskProcess(this.task);
  }

}