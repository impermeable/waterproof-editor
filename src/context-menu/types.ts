// import { Message, PpString } from "../../../../lib/types";
type Message<T> = any;
type PpString = any;

export type HelpMessages = PpString[] | Message<PpString>[];