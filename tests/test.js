const exifr = require("exifr");
const { setAnnotationForA1111Images } = require("../js/logic.js");
const { TextEncoder, TextDecoder } = require("util");

Object.assign(global, { TextDecoder, TextEncoder });

// Mocking the external module
jest.mock("exifr", () => ({
  parse: jest.fn(),
}));

jest.spyOn(window, "close").mockImplementation(jest.fn());

// Mocking the eagle object and other necessary parts
global.eagle = {
  item: {
    getSelected: jest.fn(),
    save: jest.fn(),
  },
};

window.require = require;

// Mocking document and window objects
// jest.setup.js
document.getElementById = jest.fn().mockImplementation((id) => {
  if (id === "dynamic-list") {
    return {
      childNodes: [],
      appendChild: jest.fn(),
    };
  }
  if (id === "continueButton") {
    return {
      addEventListener: jest.fn((_, cb) => cb()),
    };
  }
  return null;
});

describe("Plugin Run Tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    exifr.parse.mockClear();
    eagle.item.getSelected.mockClear();
    document.getElementById.mockClear();
    // Add more resets if needed
  });

  it("does not process non-png files", async () => {
    eagle.item.getSelected.mockResolvedValue([
      { ext: "jpg", filePath: "path/to/file.jpg" },
      {
        ext: "png",
        filePath: "path/to/file2.png",
        save: jest.fn(),
      },
    ]);
    await setAnnotationForA1111Images();
    // assertions for non-png files
    expect(exifr.parse).toHaveBeenCalledTimes(1);
  });

  it("parameters got saved into annotation prop of item", async () => {
    let testItem = {
      ext: "png",
      filePath: "path/to/file2.png",
      save: jest.fn(),
    };
    const mockedOutput = { parameters: "my a1111 gen info" };
    eagle.item.getSelected.mockResolvedValue([testItem]);
    exifr.parse.mockResolvedValue(mockedOutput);
    await setAnnotationForA1111Images();
    // assertions for same string in item prop
    expect(testItem.annotation).toBe(mockedOutput.parameters);
  });

  it("should create list entry if item already has an annotation", async () => {
    // Arrange
    const mockItems = [
      {
        name: "Image",
        ext: "png",
        filePath: "path/to/image.png",
        annotation: "Existing",
        save: jest.fn(),
      },
    ];
    const mockedOutput = { parameters: "my a1111 gen info" };
    exifr.parse.mockResolvedValue(mockedOutput);
    eagle.item.getSelected.mockResolvedValue(mockItems);

    // Act
    // Invoke your plugin's main function
    await setAnnotationForA1111Images();

    // Assert
    expect(mockItems[0].annotation).toBe("Existing");
  });
});
