import { EditType, typeFromDocChange, isWrappingDocChange, isDocChange } from "../src/edit-utils";
import { DocChange, WrappingDocChange } from "../src/api";

const docChange = (startInFile: number, endInFile: number, finalText: string): DocChange => ({
    startInFile, endInFile, finalText
});

const wrappingDocChange = (first: DocChange, second: DocChange): WrappingDocChange => ({
    firstEdit: first,
    secondEdit: second,
});

describe("typeFromDocChange", () => {
    test("returns Insert when start equals end", () => {
        expect(typeFromDocChange(docChange(5, 5, "hello"))).toBe(EditType.Insert);
    });

    test("returns Insert when start equals end and finalText is empty", () => {
        expect(typeFromDocChange(docChange(3, 3, ""))).toBe(EditType.Insert);
    });

    test("returns Replace when start differs from end and finalText is non-empty", () => {
        expect(typeFromDocChange(docChange(0, 5, "new text"))).toBe(EditType.Replace);
    });

    test("returns Delete when start differs from end and finalText is empty", () => {
        expect(typeFromDocChange(docChange(2, 10, ""))).toBe(EditType.Delete);
    });
});

describe("isWrappingDocChange", () => {
    test("returns true for a WrappingDocChange", () => {
        const change = wrappingDocChange(docChange(0, 0, "("), docChange(5, 5, ")"));
        expect(isWrappingDocChange(change)).toBe(true);
    });

    test("returns false for a DocChange", () => {
        expect(isWrappingDocChange(docChange(0, 5, "text"))).toBe(false);
    });
});

describe("isDocChange", () => {
    test("returns true for a DocChange", () => {
        expect(isDocChange(docChange(1, 3, "x"))).toBe(true);
    });

    test("returns false for a WrappingDocChange", () => {
        const change = wrappingDocChange(docChange(0, 0, "("), docChange(5, 5, ")"));
        expect(isDocChange(change)).toBe(false);
    });
});
