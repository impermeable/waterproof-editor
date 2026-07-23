import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { INPUT_AREA_PLUGIN_KEY } from "../inputArea";
import { Decoration, DecorationSet } from "prosemirror-view";
import { WaterproofSchema } from "../schema";

export const STUDENT_HIDDEN_PLUGIN_KEY = new PluginKey(
  "waterproof-student-hidden-plugin",
);

export const studentHiddenPlugin = new Plugin({
  key: STUDENT_HIDDEN_PLUGIN_KEY,

  props: {
    decorations(state: EditorState) {
      const teacher = INPUT_AREA_PLUGIN_KEY.getState(state)?.teacher ?? false;

      // Decorate every student_hidden node with a class based on the current mode.
      const decos: Array<Decoration> = [];

      state.doc.descendants((node, pos) => {
        if (node.type === WaterproofSchema.nodes.student_hidden) {
          decos.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: teacher
                ? "student-hidden-teacher"
                : "student-hidden-student",
            }),
          );
          return false;
        }
      });

      return DecorationSet.create(state.doc, decos);
    },
  },
});
