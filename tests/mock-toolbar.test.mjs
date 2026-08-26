import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../mock-toolbar.js", import.meta.url), "utf8");

function loadApi() {
  const context = vm.createContext({});
  vm.runInContext(source, context);
  return context.DABOYZ_MOCK_TOOLBAR;
}

test("toolbar is shown for mocks and hidden for actual drafts", () => {
  const state = loadApi().toolbarState;
  assert.equal(state("mock", false, false).hidden, false);
  assert.equal(state("actual", false, false).hidden, true);
});

test("step controls yield to the user's selection and disable when complete", () => {
  const state = loadApi().toolbarState;
  const onClock = state("mock", false, true);
  assert.equal(onClock.stepHidden, true);
  assert.match(onClock.status, /on the clock/i);
  const complete = state("mock", true, false);
  assert.equal(complete.stepHidden, false);
  assert.equal(complete.fullDisabled, true);
  assert.match(complete.status, /complete/i);
});

test("toolbar delegates to the original simulation controls", () => {
  assert.match(source, /sourceToMe\.click\(\)/);
  assert.match(source, /sourceNext\.click\(\)/);
  assert.match(source, /sourceFull\.click\(\)/);
  assert.match(source, /clock\.insertAdjacentElement\("afterend", toolbar\)/);
  assert.match(source, /<details class="mock-toolbar-more">/);
  assert.doesNotMatch(source, /function simulate(ToMyPick|NextOpponent|FullRoom)/);
});
