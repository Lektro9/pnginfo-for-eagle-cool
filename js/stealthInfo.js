const sharp = require("sharp");
const pako = require("pako");
async function readInfoFromImageStealth(image) {
  let geninfo, paramLen;
  let r, g, b, a;

  const metadata = await sharp(image).metadata();
  const rawImageData = await sharp(image).raw().toBuffer();
  const [width, height] = [metadata.width, metadata.height];

  const data = rawImageData;

  let hasAlpha = metadata.hasAlpha;
  let mode = null;
  let compressed = false;
  let binaryData = "";
  let bufferA = "";
  let bufferRGB = "";
  let indexA = 0;
  let indexRGB = 0;
  let sigConfirmed = false;
  let confirmingSignature = true;
  let readingParamLen = false;
  let readingParam = false;
  let readEnd = false;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let i = (y * width + x) * 4;

      if (hasAlpha) {
        [r, g, b, a] = data.slice(i, i + 4);
        bufferA += (a & 1).toString();
        indexA++;
      } else {
        [r, g, b] = data.slice(i, i + 3);
      }
      bufferRGB += (r & 1).toString();
      bufferRGB += (g & 1).toString();
      bufferRGB += (b & 1).toString();
      indexRGB += 3;

      if (confirmingSignature) {
        if (indexA === "stealth_pnginfo".length * 8) {
          const decodedSig = new TextDecoder().decode(
            new Uint8Array(bufferA.match(/\d{8}/g).map((b) => parseInt(b, 2)))
          );
          if (
            decodedSig === "stealth_pnginfo" ||
            decodedSig === "stealth_pngcomp"
          ) {
            confirmingSignature = false;
            sigConfirmed = true;
            readingParamLen = true;
            mode = "alpha";
            if (decodedSig === "stealth_pngcomp") {
              compressed = true;
            }
            bufferA = "";
            indexA = 0;
          } else {
            readEnd = true;
            break;
          }
        } else if (indexRGB === "stealth_pnginfo".length * 8) {
          const decodedSig = new TextDecoder().decode(
            new Uint8Array(bufferRGB.match(/\d{8}/g).map((b) => parseInt(b, 2)))
          );
          if (
            decodedSig === "stealth_rgbinfo" ||
            decodedSig === "stealth_rgbcomp"
          ) {
            confirmingSignature = false;
            sigConfirmed = true;
            readingParamLen = true;
            mode = "rgb";
            if (decodedSig === "stealth_rgbcomp") {
              compressed = true;
            }
            bufferRGB = "";
            indexRGB = 0;
          }
        }
      } else if (readingParamLen) {
        if (mode === "alpha" && indexA === 32) {
          paramLen = parseInt(bufferA, 2);
          readingParamLen = false;
          readingParam = true;
          bufferA = "";
          indexA = 0;
        } else if (mode != "alpha" && indexRGB === 33) {
          paramLen = parseInt(bufferRGB.slice(0, -1), 2);
          readingParamLen = false;
          readingParam = true;
          bufferRGB = bufferRGB.slice(-1);
          indexRGB = 1;
        }
      } else if (readingParam) {
        if (mode === "alpha" && indexA === paramLen) {
          binaryData = bufferA;
          readEnd = true;
          break;
        } else if (mode != "alpha" && indexRGB >= paramLen) {
          binaryData = bufferRGB.slice(0, paramLen - indexRGB);
          readEnd = true;
          break;
        }
      } else {
        // Impossible
        readEnd = true;
        break;
      }
    }

    if (readEnd) {
      break;
    }
  }

  if (sigConfirmed && binaryData) {
    // Convert binary string to UTF-8 encoded text
    const byteData = new Uint8Array(
      binaryData.match(/\d{8}/g).map((b) => parseInt(b, 2))
    );
    let decodedData;
    if (compressed) {
      decodedData = pako.inflate(byteData, { to: "string" });
    } else {
      decodedData = new TextDecoder().decode(byteData);
    }
    geninfo = decodedData;
  }

  return geninfo;
}
