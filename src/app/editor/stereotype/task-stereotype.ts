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
  getTaskInputObjectsByTaskId(taskId: string): any[] {
    return this.getTaskHandlerByTaskId(taskId).getTaskInputObjects()
  }

  getTaskOutputObjectsByTaskId(taskId: string): any[] {
    return this.getTaskHandlerByTaskId(taskId).getTaskOutputObjects();
  }

  /** Wrappers to access taskHandler functions */
  getTaskHandlerByTaskId(taskId: string): any {
    return this.taskHandler.getTaskHandlerByTaskId(taskId);
  }

  getMessageFlowHandlerByMessageFlowId(messageFlowId: string): any {
    return this.taskHandler.getMessageFlowHandlerByMessageFlowId(messageFlowId);
  }

  getTaskInputObjects(): any[] {
    return this.taskHandler.getTaskInputObjects();
  }

  getTaskOutputObjects(): any[] {
    return this.taskHandler.getTaskOutputObjects();
  }

  getTaskInputOutputObjects(): any[] {
    return this.taskHandler.getTaskInputOutputObjects();
  }

  highlightTaskInputAndOutputObjects(): void {
    this.taskHandler.highlightTaskInputAndOutputObjects();
  }

  removeTaskInputsOutputsHighlights(): void {
    this.taskHandler.removeTaskInputsOutputsHighlights();
  }

  addStereotypeToTheListOfGroupStereotypesOnModel(stereotype: string): void {
    this.taskHandler.addStereotypeToTheListOfGroupStereotypesOnModel(stereotype);
  }

  areGroupsTasksInSameOrderOnAllPoolsAndLanes(): boolean {
    return this.taskHandler.areGroupsTasksInSameOrderOnAllPoolsAndLanes();
  }

  getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes(): any[] {
    return this.taskHandler.getGroupsTasksThatAreNotInSameOrderOnAllPoolsAndLanes();
  }

  getAllTaskStereotypeInstances(): any[] {
    return this.taskHandler.getAllTaskStereotypeInstances();
  }

  getDataObjectVisibilityStatus(dataObjectId: string): string[] { return []; }

  /** Wrappers to access validationHandler functions */

  isInteger(value: any): boolean {
    return this.validationHandler.isInteger(value);
  }

  areNamesUnique(array: any[]): boolean {
    return this.validationHandler.areNamesUnique(array);
  }

  areTasksParallel(taskIds: string[]): boolean {
    return this.validationHandler.areTasksParallel(taskIds);
  }

  areAllGroupTasksAccesible(): boolean {
    return this.validationHandler.areAllGroupTasksAccesibleForTask(this.task.id);
  }

  getTaskOutputObjectsBasedOnTaskStereotype(): any[] {
    return this.taskHandler.getTaskOutputObjectsBasedOnTaskStereotype();
  }

  isOneOfInputObjectsInTaskStereotypeOutputs(taskId: string, inputObjects: any[]): boolean {
    return this.validationHandler.isOneOfInputObjectsInTaskStereotypeOutputs(taskId, inputObjects);
  }

  taskHasInputElement(elementId: string): boolean {
    return this.validationHandler.taskHasInputElement(this.task.id, elementId);
  }

  taskHasOutputElement(elementId: string): boolean {
    return this.validationHandler.taskHasOutputElement(this.task.id, elementId);
  }

  getTasksOfIncomingPath(): string[] {
    return this.taskHandler.getTasksOfIncomingPath();
  }

  getTasksOfOutgoingPath(): string[] {
    return this.validationHandler.getTasksOfOutgoingPathByInputElement(this.task);
  }

  taskIsInIncomingPath(taskId: string): boolean {
    return this.validationHandler.taskIsInIncomingPathOfTask(taskId, this.task.id);
  }

  taskIsInOutgoingPath(taskId: string): boolean {
    return this.validationHandler.taskIsInOutgoingPathOfTask(taskId, this.task.id);
  }

  taskHasStereotype(task: any, stereotype: string): boolean {
    return this.validationHandler.taskHasStereotype(task, stereotype);
  }

  isThereAtLeastOneStartEventInCurrentTaskProcess(): boolean {
    return this.validationHandler.isThereAtLeastOneStartEventInCurrentTaskProcess(this.task);
  }

}