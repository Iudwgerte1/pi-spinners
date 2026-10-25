import assert from "node:assert/strict";
import test from "node:test";
import { parseWords } from "../extensions/spinners.ts";

test("blank file falls back to the default word", () => {
  assert.deepEqual(parseWords(""), ["Working"]);
  assert.deepEqual(parseWords("\n \r\n\t\n"), ["Working"]);
});

test("words are trimmed, CRLF-safe, and empty lines dropped", () => {
  assert.deepEqual(parseWords("Baking\r\n\n Brewing \n"), ["Baking", "Brewing"]);
});
