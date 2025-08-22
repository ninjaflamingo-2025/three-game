class FSM {
  constructor(states) {
    this.states = {}; 
    this.currentState = null; 
    states.forEach((state) => this.addState(state))
  }
  addState(state) {
    if(!this.currentState){
      this.currentState = state 
    }
    this.states[state.name] = state;
  }
  transitionTo(newStateName) {
    const newState = this.states[newStateName];
    if (!newState) {
      console.error(`State "${newStateName}" doesn't exist.`);
      return;
    }
    if (this.currentState) {
      this.currentState.exit();
    }
    this.currentState = newState;
    this.currentState.enter();
  }
}
class Animation {
  constructor({ name, mesh }) {
    this.name = name;
    this.mesh = mesh;
  }
  
  play() {
    const action = this.mesh.animationActions[this.name];
    action.setLoop(THREE.LoopRepeat);
    action.clampWhenFinished = true; 
    action.reset();
    action.play();
  }

  stop() {
    const action = this.mesh.animationActions[this.name];
    action.stop();
    action.reset();
  }

  enter() {
    this.play();
  }

  exit() {
    this.stop();
  }

  update(delta) {
    this.mesh.mixer.update(delta)
    this.mesh.rootBone.position.set(this.mesh.position.x, 0.5, this.mesh.position.z) 
  }
}
