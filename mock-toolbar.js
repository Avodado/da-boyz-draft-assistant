(function (root) {
  "use strict";

  function toolbarState(draftType, complete, myTurn) {
    if (draftType === "actual") return { hidden: true, stepHidden: false, status: "", fullDisabled: false };
    if (complete) return { hidden: false, stepHidden: false, status: "Mock complete.", fullDisabled: true };
    if (myTurn) return { hidden: false, stepHidden: true, status: "You’re on the clock — make your selection.", fullDisabled: false };
    return { hidden: false, stepHidden: false, status: "Opponent on the clock.", fullDisabled: false };
  }

  function mount() {
    const document = root.document;
    if (!document || document.getElementById("mockToolbar")) return;
    const clock = document.querySelector("#draft .clock");
    const sourceNext = document.getElementById("simNext");
    const sourceToMe = document.getElementById("simToMe");
    const sourceFull = document.getElementById("simFull");
    if (!clock || !sourceNext || !sourceToMe || !sourceFull) return;

    const style = document.createElement("style");
    style.id = "mockToolbarStyles";
    style.textContent = `
      .mock-toolbar{margin:12px 0;padding:12px;border:1px solid #273449;border-radius:12px;background:#111a29;box-shadow:0 8px 24px rgba(0,0,0,.18)}
      .mock-toolbar[hidden],.mock-toolbar [hidden],.mock-toolbar-source-hidden{display:none!important}
      .mock-toolbar-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
      .mock-toolbar-title{font-weight:800;color:#f8fafc}
      .mock-toolbar-status{font-size:12px;color:#9fb0c8;text-align:right}
      .mock-toolbar-actions{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:8px}
      .mock-toolbar button{min-height:42px}
      .mock-toolbar-more{margin-top:8px;color:#b9c7da}
      .mock-toolbar-more summary{cursor:pointer;font-size:13px;font-weight:700;user-select:none}
      .mock-toolbar-more-body{display:flex;align-items:center;gap:10px;margin-top:8px}
      .mock-toolbar-more .mini{margin:0;line-height:1.35}
      @media(max-width:700px){
        .mock-toolbar{position:sticky;top:8px;z-index:20;margin:8px 0 10px;padding:10px;background:rgba(17,26,41,.97);backdrop-filter:blur(8px)}
        .mock-toolbar-head{margin-bottom:7px}
        .mock-toolbar-actions{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)}
        .mock-toolbar-actions button{padding-left:8px;padding-right:8px;font-size:13px}
        .mock-toolbar-more-body{align-items:flex-start;flex-direction:column}
      }
    `;
    document.head.appendChild(style);

    const toolbar = document.createElement("section");
    toolbar.id = "mockToolbar";
    toolbar.className = "mock-toolbar";
    toolbar.setAttribute("aria-label", "Mock draft controls");
    toolbar.innerHTML = `
      <div class="mock-toolbar-head">
        <span class="mock-toolbar-title">Mock controls</span>
        <span id="mockToolbarStatus" class="mock-toolbar-status" aria-live="polite"></span>
      </div>
      <div id="mockToolbarStepActions" class="mock-toolbar-actions">
        <button id="mockSimToMe" class="goodbtn" type="button">Simulate To My Pick</button>
        <button id="mockSimNext" class="secondary" type="button">Next Opponent</button>
      </div>
      <details class="mock-toolbar-more">
        <summary>More</summary>
        <div class="mock-toolbar-more-body">
          <button id="mockSimFull" class="secondary" type="button">Autodraft Full Room</button>
          <div class="mini">Completes every remaining pick after confirmation.</div>
        </div>
      </details>
    `;
    clock.insertAdjacentElement("afterend", toolbar);

    document.getElementById("mockSimToMe").addEventListener("click", function () { sourceToMe.click(); });
    document.getElementById("mockSimNext").addEventListener("click", function () { sourceNext.click(); });
    document.getElementById("mockSimFull").addEventListener("click", function () { sourceFull.click(); });

    const sourceActions = sourceNext.parentElement;
    const sourceHeading = sourceActions && sourceActions.previousElementSibling;
    const sourceNote = sourceActions && sourceActions.nextElementSibling;
    [sourceHeading, sourceActions, sourceNote].forEach(function (node) {
      if (node) {
        node.hidden = true;
        node.classList.add("mock-toolbar-source-hidden");
      }
    });

    const draftType = document.getElementById("archiveDraftType");
    const stepActions = document.getElementById("mockToolbarStepActions");
    const status = document.getElementById("mockToolbarStatus");
    const full = document.getElementById("mockSimFull");
    const toMe = document.getElementById("mockSimToMe");
    const next = document.getElementById("mockSimNext");

    function update() {
      let complete = false;
      let myTurn = false;
      try {
        const selection = typeof root.current === "function" ? root.current() : null;
        const mine = typeof root.myTeam === "function" ? root.myTeam() : null;
        complete = !selection;
        myTurn = Boolean(selection && mine && Number(selection.card) === Number(mine.card));
      } catch (_) {
        const clockText = (document.getElementById("clockTeam") || {}).textContent || "";
        complete = /complete/i.test(clockText);
        myTurn = /my team/i.test(clockText);
      }
      const state = toolbarState(draftType ? draftType.value : "mock", complete, myTurn);
      toolbar.hidden = state.hidden;
      stepActions.hidden = state.stepHidden;
      status.textContent = state.status;
      full.disabled = state.fullDisabled;
      toMe.disabled = complete;
      next.disabled = complete;
    }

    if (draftType) draftType.addEventListener("change", update);
    [document.getElementById("clockTeam"), document.getElementById("kMade")].forEach(function (node) {
      if (node && root.MutationObserver) new root.MutationObserver(update).observe(node, { childList: true, characterData: true, subtree: true });
    });
    root.DABOYZ_MOCK_TOOLBAR.update = update;
    update();
  }

  root.DABOYZ_MOCK_TOOLBAR = { version: "1.0", mount: mount, update: function () {}, toolbarState: toolbarState };
  if (root.document) mount();
})(globalThis);
