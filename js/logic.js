const exifr = require("exifr");

// Stable Diffusion: parameters
// Midjourney: Description
// add your property key in this array
const parameterProps = ["parameters", "Description"];

const setAnnotationForA1111Images = async () => {
  let items = await eagle.item.getSelected();
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item.ext.toLowerCase() !== "png") continue;
    const output = await exifr.parse(item.filePath);
    console.log(output);
    if (item.annotation) {
      createListEntry(item.name);
      continue;
    }

    const propKey = findFirstExistingProperty(output, parameterProps);

    //skip item if none of the props where found (means there are no parameters in the metadata)
    if (!propKey) continue;

    item.annotation = output[propKey];
    // Save modifications
    await item.save();
  }

  if (itemNotChanged()) {
    await userConfirm();
  }

  window.close();
};

const itemNotChanged = () => {
  const children = document.getElementById("dynamic-list").childNodes;
  return children.length !== 0;
};

const createListEntry = (fileName) => {
  const list = document.getElementById("dynamic-list");
  const li = document.createElement("li");
  li.innerText = fileName;
  li.classList.add("mb-2");
  list.appendChild(li);
};

const userConfirm = async () => {
  return new Promise((resolve) => {
    const button = document.getElementById("continueButton");
    button.addEventListener("click", () => {
      resolve();
    });
  });
};

function findFirstExistingProperty(object, propertyNames) {
  for (const propertyName of propertyNames) {
    if (object?.hasOwnProperty(propertyName)) {
      return propertyName;
    }
  }
  return null; // Return null if none of the properties exist in the object
}

module.exports = {
  setAnnotationForA1111Images,
};
