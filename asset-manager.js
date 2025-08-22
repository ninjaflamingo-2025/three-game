const ASSET_STORE = {
  models: {},
  textures: {},
  sprites: {},
  get(path) {
    const parts = path.split('/'); // ['models', 'humvee']
    let current = this;
    for (let part of parts) {
      if (current && current[part] !== undefined) {
        current = current[part];
      } else {
        throw new Error(`Path part '${part}' does not exist.`);
      }
    }
    const result = current;
    return result 
  }
}

export class Asset {
  constructor(name, path, data, loader){
    this.name = name
    this.path = path // path: asset_store path, will need to have some regex or a function that trims for nested stuff
    this.data = data
    this.loader = loader
  }
}

class AssetManager extends EventTarget {
  constructor(asset_store){
    super()
    this.asset_store = asset_store
    this.state = new Proxy(
      {
        total: 0,
        in_progress: 0,
        completed: 0
      },
      {
        set: (target, prop, value) => {
          
          target[prop] = value;
          
          const { completed, total } = this.state
          const progress = (completed / total) * 100;

          if(completed === total){
            const event = new CustomEvent('complete', { detail: { message: 'Task complete' } });
            this.dispatchEvent(event);
            //console.log('asset manager loaded assets')
          }else {
            const event = new CustomEvent('loading', { detail: { status: progress } });
            //console.log('asset manager is loading')
            this.dispatchEvent(event);
          }
          return true;  
        }
      }
    );
    this.assets = []
    this.loaders = {
      cube_texture_loader: new THREE.CubeTextureLoader(),
      gltfl_loader: new GLTFLoader(),
      texture_loader: new THREE.TextureLoader(),
      fbx_loader: new FBXLoader()
    }
  }
  
  add(asset){
    //console.log('adding asset to asset manager: ', asset)
    const count = this.assets.push(asset);
    this.state.total = count 
  }
  // only objects with geometries can have a bounding box
  loadAsset(asset){
    console.log('loading asset: ', asset)
    const { asset_store } = this
    if (!asset_store) {
      throw new Error(`ERR asset_store not set  ${typeof asset_store}`);
    }
    if(!asset_store[asset.path]){
      throw new Error(`PATH does not exist in asset_store: '${asset.path}'`);
    }
    const loader = this.loaders[asset.loader]; 
    loader.setCrossOrigin("anonymous");
    if (loader) {
      loader.load(asset.data, (result) => {
 
   if (asset.loader === 'gltfl_loader' || asset.loader === 'fbx_loader') {
            const mesh = asset.loader === 'gltfl_loader' ? result.scene : result; 
            mesh.clock = new THREE.Clock(); 
            if(result.animations){
              const mixer = new THREE.AnimationMixer(mesh);
              mesh.mixer = mixer
              mesh.animationActions = {};
              mesh.animations = result.animations; 
              result.animations.forEach((animation) => {
                const action = mixer.clipAction(animation);
                mesh.animationActions[animation.name] = action; 
                //console.log(animation.name)
              })
            }
            asset_store[asset.path][asset.name] = mesh
          
        }else {
          asset_store[asset.path][asset.name] = result;
        }
        this.state.completed += 1
        asset = null // change later, the result will still need to go to the asset store 
      }, (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;
      }, (error) => {
        //console.error(`Error loading ${asset.name}:`, error);
      });
    } else {
      //console.error(`Loader for ${asset.loader} not found.`);
    }
  }
  
  loadAssets() {
    const { assets } = this
    const length = assets.length
    for(let i=0; i < length; i++){
      const asset = assets.shift()
      this.loadAsset(asset)
    }
  }
  on(event, listener) {
    this.addEventListener(event, listener);
  }
}
export const asset_manager = new AssetManager(ASSET_STORE);


