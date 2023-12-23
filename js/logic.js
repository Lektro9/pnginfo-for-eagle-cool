const exifr = require("exifr");

const setAnnotationForA1111Images = async () => {
  let items = await eagle.item.getSelected();
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item.ext.toLowerCase() !== "png") continue;
    const output = await exifr.parse(item.filePath);
    if (item.annotation) {
      createListEntry(item.name);
      continue;
    }
    // Modify attributes
    if (!output?.parameters) continue;

    item.annotation = output.parameters;
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

module.exports = {
  setAnnotationForA1111Images,
};
