// clothPipeline.js
import { removeBackground } from "./removeBg.js";
import { setCloth } from "./renderer.js";

export async function handleClothChange(clothUrl) {
  const processed = await removeBackground(clothUrl);
  setCloth(processed);
}
