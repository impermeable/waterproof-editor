// Export the Editor class
export { WaterproofEditor } from "./editor";
export { WaterproofSchema } from "./schema";
export * from "./document";
export * from "./api";
export { defaultToMarkdown } from "./translation";
export * as "markdown" from "./markdown-defaults";
export {
  DocumentSerializer,
  DefaultTagSerializer,
} from "./serialization/DocumentSerializer";
export { Node } from "prosemirror-model";
export * from "./edit-utils";
export { wrapInContainer } from "./commands";
