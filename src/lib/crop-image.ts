export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

const OUTPUT_SIZE = 512;

/**
 * Rotates the source image onto an intermediate canvas, then draws the
 * (rotation-aware) cropped region onto a fixed-size square output canvas,
 * and returns it as a JPEG blob ready to upload as an avatar.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  crop: PixelCrop,
  rotationDegrees: number
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const radians = (rotationDegrees * Math.PI) / 180;

  // The rotated image's bounding box can be larger than the original, so
  // size the working canvas to fit it fully before cropping out of it.
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const boundingWidth = image.width * cos + image.height * sin;
  const boundingHeight = image.width * sin + image.height * cos;

  const rotateCanvas = document.createElement("canvas");
  rotateCanvas.width = boundingWidth;
  rotateCanvas.height = boundingHeight;
  const rotateCtx = rotateCanvas.getContext("2d");
  if (!rotateCtx) throw new Error("Canvas not supported");

  rotateCtx.translate(boundingWidth / 2, boundingHeight / 2);
  rotateCtx.rotate(radians);
  rotateCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = OUTPUT_SIZE;
  outputCanvas.height = OUTPUT_SIZE;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) throw new Error("Canvas not supported");

  outputCtx.drawImage(
    rotateCanvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not export image"))),
      "image/jpeg",
      0.92
    );
  });
}
