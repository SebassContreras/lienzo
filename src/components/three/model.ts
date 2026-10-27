/** GLTF models (016/D2): `.glb` files loaded through the asset cache, fitted like a primitive. */
import { Box3, Group, type Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { assetFor } from "../../engine/assets.ts";
import { SIZE } from "./shapes.ts";

/** One object centred on the origin, its largest side `SIZE`. */
function fitted(object: Object3D): Group {
  const box = new Box3().setFromObject(object);
  const size = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  const scale = SIZE / Math.max(size.x, size.y, size.z, 1e-6);
  object.position.sub(centre).multiplyScalar(scale);
  object.scale.multiplyScalar(scale);
  const group = new Group();
  group.add(object);
  return group;
}

/** The model at `src`, fitted; the `.glb` asset loader in `lazy.ts` calls it. */
export async function loadModel(src: string): Promise<Group> {
  const gltf = await new GLTFLoader().loadAsync(src);
  return fitted(gltf.scene);
}

/** The loaded model at `src`, or undefined while it loads (or with no file chosen). */
export function modelFor(src: string): Group | undefined {
  return assetFor<Group>(src);
}
