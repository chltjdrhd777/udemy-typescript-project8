//Project Type = to separate the values stored in both activate bar and finishied bar
enum ProjectStatus { // enum is like using an object as a type. If one constant have ProjectStatus type, it's value is restricted into "Active" or "Finished"
  Active,
  Finished
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {
    // parameter "status" should be "Active" or "Finished"
  }
}

//Redundant component
type Listner<T> = (itmes: T[]) => void; // type name = ~~~ <--- which allows me to restrcit the result into assigned options. Ex) type test1 = 'a'|'b'|'c' then, const test2:test1 = 'a' or 'b' or 'c'. this is union type

class state<T> {
  protected listeners: Listner<T>[] = []; // protected : private but can be used in inheriting class

  addListener(listenerFn: Listner<T>) {
    this.listeners.push(listenerFn);
  }
}

//project state management :things that would be stored in projects array
class ProjectState extends state<Project> {
  private projects: Project[] = []; //[{id,title,description,people,status}] when intantiated

  //singleton = the blueprint of instances which I would make from now on.
  private static instance: ProjectState; // ProjectState = {projects:[], addProject(title,description,numOfPeople),...}
  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }
  /////////////////////////////////////////////////

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject); // projects: [{id,title,description,people},........]
    for (const listenerFn of this.listeners) {
      // to every function in listners, act with this.projects.slice() <--- this.projects.slice() is the copy of projects array.
      listenerFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance(); //make one instance.

//validation
interface Validatable {
  value: string | number; // there should be
  required?: boolean; // ?~~ : optional
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validatableInput: Validatable) {
  let isValid = true; // default boolean = true
  if (validatableInput.required) {
    // in case that there is "required" property in the object.
    isValid = isValid && validatableInput.value.toString().trim().length !== 0; // new isValid's answer is up to the following condition. if validatableInput.value(is string) is not empty, it is true.
  }
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    // in case that there is "minLength" property in the object + typeguard : validatableInput.value should be string. != null means not null and not undefined to avoid the situation that the minlength is 0
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength; // If validatableInput.value's length is greater than minLength, it returns true
  }

  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }

  if (
    validatableInput.min != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }

  if (
    validatableInput.max != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid; // about four "if"s which are possible scenarios, retunr true or false.
}

//autobind decorator
function autoBind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value; // in method decorator, value contain original method.
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this); // Then, autoBind would attach bind(this) which allows the target method to act in the boundary of the same area it is involved.
      return boundFn;
    }
  };
  return adjDescriptor;
}

//Redundant component
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  //this class is mandatory
  // the reason I used generic type is to give it flexibility in type definition because hostElement and element cannot guarantee their type as one type.
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertStart: boolean, // which determine where hostelement would be imposed according to whether it is a acttive bar or a finished bar.
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement; //access to the list template
    this.hostElement = document.getElementById(hostElementId)! as T;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    this.element = importedNode.firstElementChild as U;

    if (newElementId) {
      this.element.id = newElementId;
    }
    this.attach(insertStart);
  }

  private attach(insertStart: boolean) {
    this.hostElement.insertAdjacentElement(
      insertStart ? "afterbegin" : "beforeend",
      this.element
    ); // if insertStart is true, return 'afterbegin'. if not, return beforeend
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

//ProjectItem class
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> {
  private project: Project; //{id,title,.....,status}

  //getter for checking plurality and singularity

  get howMany() {
    if (this.project.people === 1) {
      return "1 person";
    } else {
      return `${this.project.people} persons`;
    }
  }

  constructor(hostId: string, project: Project) {
    //when initiated, this constructor's parameter would forward hostId to super(Component class's constructor)
    super("single-project", hostId, false, project.id);
    this.project = project;
    this.configure();
    this.renderContent();
  }

  configure() {} //dummy for inheritance
  renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title; //this.element = <li> in single project template //in <h2>, things I type in the title bar would be stored
    this.element.querySelector("h3")!.textContent = this.howMany + " assgined"; // getter do not have to get parentheses
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

//ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> {
  assignedProjects: Project[];
  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  configure() {
    projectState.addListener((projects: Project[]) => {
      //filter
      const relevantProjects = projects.filter(prj => {
        // target.filter(elements => condition), making new array with elements inside the target array only if pass through the condition.
        if (this.type === "active") {
          return prj.status === ProjectStatus.Active; //[{...status:Active},{...status:Active},......]
        }
        return prj.status === ProjectStatus.Finished; // [{...status:Finished},{...status:Finished},......]
      });

      this.assignedProjects = relevantProjects;
      this.renderProjects();
    }); //function addListener(project=>{this.assignedProjects = projects; this.renderProjects}) is stored in Listeners array. [addListener(), ...], then, It is activated because of for()
  }

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId; //I selected the unlisted order tag in project list template and I put the id which is activated-projects-list or finished-projects-list
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + "PROJECTS"; // it would be 'ACTIVE PROJECTS' or 'FINISHIED PROJECTS'
  }

  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list` // <ul> in the section of project's template
    )! as HTMLUListElement;
    listEl.innerHTML = "";

    for (const prjItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector("ul")!.id, prjItem);
    }
  }
}

//Input section
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");

    this.titleInputElement = this.element.querySelector(
      "#title"
    ) as HTMLInputElement; // in constant "element", I can find something which has an ID "title" and populate it in titleInputElement
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    ) as HTMLInputElement;

    this.configure();
  }

  configure() {
    this.element.addEventListener("submit", this.submitHandler); // if I submit something, submitHandler would get started. But, if I send anything in submitHandler, Then, for it, "this" doesn't mean the class. So, I could add .bind/ but in this case, I would aplly decorator.
  }

  renderContent() {} // dummy content, because of the structure of component class. I could erase this if I get rid of renderContent() in inheriting Class.

  private gatherUserInput(): [string, string, number] | void {
    // it would be working like an input container/ and, the result of this function is to be [string,string,string]
    const enteredTilte = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;
    //In advance, I set the whole values which could be put

    const titleValidatable: Validatable = {
      value: enteredTilte,
      required: true
    };

    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5 // the description value should have more than 5 length
    };

    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1, // the people value should have more than 1
      max: 5
    };
    if (
      ////////////////////////////////////////////////////////////////////
      //one posible way but has some limitation
      /* enteredTilte.trim().length === 0 ||
      enteredDescription.trim().length === 0 ||
      enteredPeople.trim().length === 0 */
      //////////////////////////////////////////////////////////////////
      // alternative
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable) //if validate(titleValidatable) is not true or validate(descriptionValidatable) is not true or validate(peopleValidatable) is not true, then
    ) {
      alert("Invalid input, please try again");
      return;
    } else {
      return [enteredTilte, enteredDescription, +enteredPeople];
    }
  }

  private clearInputs() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  } // after values are sent, they would disappear.

  @autoBind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput(); // in other words, userInput = [enteredTilte,enteredDescription,+enteredPeople]
    if (Array.isArray(userInput)) {
      // Array.isArray('something') = is "something" an array?
      const [title, desc, people] = userInput; // it means that the key names are "title, desc, people" and the value of each key is things in userInput array
      projectState.addProject(title, desc, people); // projects: [{id,title,description,people}]
      this.clearInputs();
    }
  }
}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");
