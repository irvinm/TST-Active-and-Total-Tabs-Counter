/**
 * @jest-environment jsdom
 */
"use strict";

const fs = require("fs");
const path = require("path");

const htmlContent = fs.readFileSync(path.resolve(__dirname, "../popup.html"), "utf8");

describe("TST Active and Total Tabs Counter - Popup UI", () => {
  let storageData;
  let sessionData;
  let mockStorageSet;
  let mockStorageGet;
  let mockSendMessage;
  let mockTabsCreate;
  let mockTabsQuery;
  let mockWindowsGetAll;
  let mockWindowsGetCurrent;
  let mockSetWindowValue;
  let storageChangedCallback;
  let spies;

  /** Advance 50 microtask turns so pending mocked browser operations can settle. */
  const flushPromises = async () => {
    for (let i = 0; i < 50; i++) {
      await Promise.resolve();
    }
  };

  /** Return the first popup element matching a CSS selector. */
  const $ = (selector) => document.querySelector(selector);
  /** Return an array of popup elements matching a CSS selector. */
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  /** Return an element's text with whitespace collapsed for readable assertions. */
  const text = (selector) => $(selector).textContent.replace(/\s+/g, " ").trim();

  /** Define the open windows: [{ id, name?, tabs: [{ title?, active?, discarded? }] }] */
  function setupWindows(defs, currentId = defs[0].id) {
    mockWindowsGetAll.mockResolvedValue(defs.map((d) => ({ id: d.id, type: "normal" })));
    mockWindowsGetCurrent.mockResolvedValue({ id: currentId });
    mockTabsQuery.mockImplementation(({ windowId }) =>
      Promise.resolve((defs.find((d) => d.id === windowId) || { tabs: [] }).tabs)
    );
    defs.forEach((d) => {
      sessionData[d.id] = { windowName: d.name || "" };
    });
  }

  /** Tick a radio the way a user would. */
  async function choose(id) {
    const radio = document.getElementById(id);
    radio.checked = true;
    radio.dispatchEvent(new Event("change"));
    await flushPromises();
  }

  /** Load popup.js and run its DOMContentLoaded handler once, in isolation. */
  async function loadPopup() {
    const original = document.addEventListener.bind(document);
    let handler;
    const spy = jest.spyOn(document, "addEventListener").mockImplementation((type, fn, opts) => {
      if (type === "DOMContentLoaded") handler = fn;
      else original(type, fn, opts);
    });
    jest.isolateModules(() => require("../popup.js"));
    spy.mockRestore();
    await handler();
    await flushPromises();
  }

  beforeEach(() => {
    jest.useFakeTimers();

    document.body.className = "popup-view";
    document.body.innerHTML = htmlContent;
    document.documentElement.removeAttribute("data-theme");
    window.innerWidth = 400;
    window.close = jest.fn();
    window.open = jest.fn();
    delete window.matchMedia;

    spies = [
      jest.spyOn(console, "log").mockImplementation(() => {}),
      jest.spyOn(console, "warn").mockImplementation(() => {}),
      jest.spyOn(console, "error").mockImplementation(() => {})
    ];

    storageData = {
      displayStyleOption: "oneLinePerWindow",
      displayOption: "switchToSVG",
      sidebarScopeOption: "all",
      badgeScopeOption: "all",
      pageTheme: "light"
    };
    sessionData = {};

    mockStorageGet = jest.fn().mockImplementation((keys) => {
      const list = typeof keys === "string" ? [keys] : keys;
      const res = {};
      list.forEach((k) => {
        if (k in storageData) res[k] = storageData[k];
      });
      return Promise.resolve(res);
    });
    mockStorageSet = jest.fn().mockImplementation((obj) => {
      Object.assign(storageData, obj);
      return Promise.resolve();
    });
    mockSendMessage = jest.fn().mockResolvedValue({ result: "Updated" });
    mockTabsCreate = jest.fn().mockResolvedValue({ id: 999 });
    mockTabsQuery = jest.fn().mockResolvedValue([]);
    mockWindowsGetAll = jest.fn().mockResolvedValue([]);
    mockWindowsGetCurrent = jest.fn().mockResolvedValue({ id: 1 });
    mockSetWindowValue = jest.fn().mockResolvedValue();

    global.browser = {
      storage: {
        local: { get: mockStorageGet, set: mockStorageSet },
        onChanged: { addListener: jest.fn((cb) => (storageChangedCallback = cb)) }
      },
      windows: { getAll: mockWindowsGetAll, getCurrent: mockWindowsGetCurrent },
      sessions: {
        getWindowValue: jest.fn((id, key) =>
          Promise.resolve(sessionData[id] && key in sessionData[id] ? sessionData[id][key] : null)
        ),
        setWindowValue: mockSetWindowValue
      },
      tabs: { create: mockTabsCreate, query: mockTabsQuery },
      runtime: {
        sendMessage: mockSendMessage,
        getURL: jest.fn((p) => `moz-extension://test-id/${p}`)
      }
    };

    setupWindows([{ id: 1, tabs: [{ active: true, title: "Tab" }] }]);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    spies.forEach((s) => s.mockRestore());
    window.history.pushState({}, "", "/");
    delete global.browser;
  });

  describe("Theme", () => {
    it("applies the stored dark theme with the sun icon and matching button label", async () => {
      storageData.pageTheme = "dark";
      await loadPopup();

      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      expect($("#page-theme-btn").title).toBe("Switch to light theme");
      expect($("#page-theme-btn").getAttribute("aria-label")).toBe("Switch to light theme");
      const svg = $("#page-theme-icon svg");
      expect(svg).not.toBeNull();
      expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect($("#page-theme-icon svg circle")).not.toBeNull();
    });

    it("applies the stored light theme with the moon icon", async () => {
      await loadPopup();

      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
      expect($("#page-theme-btn").title).toBe("Switch to dark theme");
      const svg = $("#page-theme-icon svg");
      expect(svg).not.toBeNull();
      expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect($("#page-theme-icon svg path")).not.toBeNull();
      expect($("#page-theme-icon svg circle")).toBeNull();
    });

    it("follows the OS preference when no theme has been stored", async () => {
      delete storageData.pageTheme;
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      await loadPopup();

      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      expect(mockStorageSet).not.toHaveBeenCalledWith(expect.objectContaining({ pageTheme: expect.anything() }));
    });

    it("falls back to the OS preference if reading the stored theme fails", async () => {
      mockStorageGet.mockImplementation((keys) =>
        keys === "pageTheme" ? Promise.reject(new Error("denied")) : Promise.resolve({})
      );
      window.matchMedia = jest.fn().mockReturnValue({ matches: false });
      await loadPopup();

      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    it("toggles on click, swaps the icon, and persists each choice", async () => {
      await loadPopup();

      $("#page-theme-btn").click();
      await flushPromises();
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      expect($("#page-theme-icon svg circle")).not.toBeNull();
      expect(mockStorageSet).toHaveBeenCalledWith({ pageTheme: "dark" });

      $("#page-theme-btn").click();
      await flushPromises();
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
      expect(mockStorageSet).toHaveBeenCalledWith({ pageTheme: "light" });
    });

    it("follows a theme change made in another popup without saving it again", async () => {
      await loadPopup();
      mockStorageSet.mockClear();

      storageChangedCallback({ pageTheme: { newValue: "dark" } });

      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      expect(mockStorageSet).not.toHaveBeenCalled();
    });
  });

  describe("Layout", () => {
    it("starts in compact popup mode when narrow", async () => {
      await loadPopup();
      expect(document.body.classList.contains("popup-view")).toBe(true);
      expect(document.body.classList.contains("tab-view")).toBe(false);
    });

    it("switches to the full tab layout when wide", async () => {
      window.innerWidth = 800;
      await loadPopup();
      expect(document.body.classList.contains("tab-view")).toBe(true);
      expect(document.body.classList.contains("popup-view")).toBe(false);
    });

    it("switches to the full tab layout when opened with ?mode=tab", async () => {
      window.history.pushState({}, "", "/popup.html?mode=tab");
      await loadPopup();
      expect(document.body.classList.contains("tab-view")).toBe(true);
    });

    it("opens the popup in its own tab and closes the popup", async () => {
      await loadPopup();
      $("#open-tab-btn").click();
      await flushPromises();

      expect(mockTabsCreate).toHaveBeenCalledWith({ url: "moz-extension://test-id/popup.html?mode=tab" });
      expect(window.close).toHaveBeenCalled();
    });

    it("falls back to window.open when the tabs API is unavailable", async () => {
      await loadPopup();
      delete browser.tabs.create;
      $("#open-tab-btn").click();

      expect(window.open).toHaveBeenCalledWith("moz-extension://test-id/popup.html?mode=tab", "_blank");
      expect(window.close).toHaveBeenCalled();
    });
  });

  describe("Tab navigation", () => {
    it("starts on the Window Names tab", async () => {
      await loadPopup();
      expect($("#tab-window-names").classList.contains("active")).toBe(true);
      expect($("#tab-sidebar-display").classList.contains("active")).toBe(false);
      expect($("#tab-badge-counter").classList.contains("active")).toBe(false);
    });

    it.each(["tab-sidebar-display", "tab-badge-counter", "tab-window-names"])(
      "shows only %s when its button is clicked",
      async (tabId) => {
        await loadPopup();
        $(`.tab-button[data-tab="${tabId}"]`).click();

        $$(".tab-content").forEach((content) => {
          expect(content.classList.contains("active")).toBe(content.id === tabId);
        });
        $$(".tab-button").forEach((button) => {
          expect(button.classList.contains("active")).toBe(button.getAttribute("data-tab") === tabId);
        });
      }
    );
  });

  describe("Loading saved settings", () => {
    it("writes defaults, checks default radios, and tells the background script when storage is empty", async () => {
      storageData = {};
      await loadPopup();

      expect(mockStorageSet).toHaveBeenCalledWith({ displayOption: "switchToSVG" });
      expect(mockStorageSet).toHaveBeenCalledWith({ displayStyleOption: "oneLinePerWindow" });
      expect(document.getElementById("switchToSVG").checked).toBe(true);
      expect(document.getElementById("oneLinePerWindow").checked).toBe(true);
      expect(document.getElementById("sidebarScopeAll").checked).toBe(true);
      expect(document.getElementById("badgeScopeAll").checked).toBe(true);
      expect(mockSendMessage).toHaveBeenCalledWith({ action: "setTabCountMethod", tabCountMethod: 1 });
    });

    it("restores every saved choice and highlights the matching option cards", async () => {
      storageData.displayOption = "alwaysSVG";
      storageData.displayStyleOption = "compactView";
      storageData.sidebarScopeOption = "current";
      storageData.badgeScopeOption = "current";
      await loadPopup();

      ["alwaysSVG", "compactView", "sidebarScopeCurrent", "badgeScopeCurrent"].forEach((id) => {
        expect(document.getElementById(id).checked).toBe(true);
        expect(document.getElementById(id).closest(".option-card").classList.contains("selected")).toBe(true);
      });
      ["switchToSVG", "oneLinePerWindow", "sidebarScopeAll", "badgeScopeAll"].forEach((id) => {
        expect(document.getElementById(id).closest(".option-card").classList.contains("selected")).toBe(false);
      });
      expect(mockSendMessage).toHaveBeenCalledWith({ action: "setTabCountMethod", tabCountMethod: 2 });
    });

    it("does not overwrite settings that are already valid", async () => {
      storageData.displayOption = "alwaysSVG";
      storageData.displayStyleOption = "compactView";
      await loadPopup();

      expect(mockStorageSet).not.toHaveBeenCalled();
    });

    it("replaces an unrecognised render method with the default", async () => {
      storageData.displayOption = "nativeBadge";
      await loadPopup();

      expect(mockStorageSet).toHaveBeenCalledWith({ displayOption: "switchToSVG" });
      expect(document.getElementById("switchToSVG").checked).toBe(true);
    });
  });

  describe("Sidebar preview", () => {
    it.each([
      [
        "oneLinePerWindow",
        "all",
        "*Work: 12 / 145 tabs Social: 8 / 210 tabs Win3: 4 / 22 tabs Win4: 1 / 9 tabs Total: 25 / 386 tabs"
      ],
      ["oneLinePerWindow", "current", "Work: 12 / 145 tabs"],
      ["compactView", "all", "*Work: 12/145, Social: 8/210, W3: 4/22, W4: 1/9, T: 25/386"],
      ["compactView", "current", "Work: 12/145"]
    ])("renders the %s layout for %s-window scope", async (layout, scope, expected) => {
      storageData.displayStyleOption = layout;
      storageData.sidebarScopeOption = scope;
      await loadPopup();

      expect(text("#sidebar-preview")).toBe(expected);
    });

    it("demonstrates four windows: two named and two unnamed", async () => {
      await loadPopup();
      expect($$("#sidebar-preview .sidebar-preview-row").length).toBe(5);
    });

    it("re-renders and notifies the background script when the layout changes", async () => {
      await loadPopup();
      mockSendMessage.mockClear();

      await choose("compactView");

      expect(mockStorageSet).toHaveBeenCalledWith({ displayStyleOption: "compactView" });
      expect(mockSendMessage).toHaveBeenCalledWith({ action: "setTabCountMethod", tabCountMethod: 2 });
      expect($("#sidebar-preview .sidebar-preview-compact")).not.toBeNull();
      expect(text("#message")).toBe("Display option saved!");

      await choose("oneLinePerWindow");
      expect(mockSendMessage).toHaveBeenCalledWith({ action: "setTabCountMethod", tabCountMethod: 1 });
      expect($("#sidebar-preview .sidebar-preview-table")).not.toBeNull();
    });

    it("keeps the chosen layout when the scope changes, and vice versa", async () => {
      storageData.displayStyleOption = "compactView";
      await loadPopup();
      mockSendMessage.mockClear();

      await choose("sidebarScopeCurrent");

      expect(mockStorageSet).toHaveBeenCalledWith({ sidebarScopeOption: "current" });
      expect(mockSendMessage).toHaveBeenCalledWith({
        action: "updateSidebarScope",
        sidebarScopeOption: "current"
      });
      expect(text("#sidebar-preview")).toBe("Work: 12/145");
      expect(text("#message")).toBe("Sidebar scope saved!");

      await choose("oneLinePerWindow");
      expect(text("#sidebar-preview")).toBe("Work: 12 / 145 tabs");
    });

    it("moves the selected highlight to the newly chosen card", async () => {
      await loadPopup();
      await choose("sidebarScopeCurrent");

      expect(document.getElementById("sidebarScopeCurrent").closest(".option-card").classList.contains("selected")).toBe(true);
      expect(document.getElementById("sidebarScopeAll").closest(".option-card").classList.contains("selected")).toBe(false);
    });

    it("does not notify the background script if saving the scope fails", async () => {
      await loadPopup();
      mockSendMessage.mockClear();
      mockStorageSet.mockRejectedValueOnce(new Error("quota"));

      await choose("sidebarScopeCurrent");

      expect(console.error).toHaveBeenCalledWith("Error saving sidebar scope:", expect.any(Error));
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("clears the status message after 2.5 seconds", async () => {
      await loadPopup();
      await choose("compactView");
      expect(text("#message")).toBe("Display option saved!");

      jest.advanceTimersByTime(2500);
      expect(text("#message")).toBe("");
    });
  });

  describe("Badge preview and settings", () => {
    it("shows four stages with arrows between them for switchToSVG", async () => {
      await loadPopup();

      expect($$("#badge-preview .badge-stage").length).toBe(4);
      expect($$("#badge-preview .badge-arrow").length).toBe(3);
      expect($$("#badge-preview .badge-caption").map((c) => c.textContent)).toEqual([
        "1–9",
        "10–99",
        "100–999",
        "1000+"
      ]);
      const sources = $$("#badge-preview img").map((i) => i.getAttribute("src"));
      expect(sources[0]).toContain("BadgeText-9");
      expect(sources[3]).toContain("SVG-1000");
    });

    it("uses SVG artwork for every stage for alwaysSVG", async () => {
      storageData.displayOption = "alwaysSVG";
      await loadPopup();

      const sources = $$("#badge-preview img").map((i) => i.getAttribute("src"));
      expect(sources).toHaveLength(4);
      sources.forEach((src) => expect(src).toContain("SVG-"));
      expect(sources.some((src) => src.includes("BadgeText"))).toBe(false);
    });

    it("gives every preview image descriptive alt text", async () => {
      await loadPopup();
      expect($$("#badge-preview img").map((i) => i.alt)).toEqual([
        "1–9 tabs",
        "10–99 tabs",
        "100–999 tabs",
        "1000+ tabs"
      ]);
    });

    it("re-renders the preview, saves, and asks the background script to update when the render method changes", async () => {
      await loadPopup();
      mockSendMessage.mockClear();

      await choose("alwaysSVG");

      expect(mockStorageSet).toHaveBeenCalledWith({ displayOption: "alwaysSVG" });
      expect(mockSendMessage).toHaveBeenCalledWith({ action: "updateBadge" });
      expect($$("#badge-preview img").every((i) => i.getAttribute("src").includes("SVG-"))).toBe(true);
      expect(text("#message")).toBe("Badge counter option saved!");
    });

    it("saves the badge scope and notifies the background script", async () => {
      await loadPopup();
      mockSendMessage.mockClear();

      await choose("badgeScopeCurrent");

      expect(mockStorageSet).toHaveBeenCalledWith({ badgeScopeOption: "current" });
      expect(mockSendMessage).toHaveBeenCalledWith({
        action: "updateBadgeScope",
        badgeScopeOption: "current"
      });
      expect(text("#message")).toBe("Badge scope saved!");

      await choose("badgeScopeAll");
      expect(mockSendMessage).toHaveBeenCalledWith({ action: "updateBadgeScope", badgeScopeOption: "all" });
    });

    it("does not notify the background script if saving the badge scope fails", async () => {
      await loadPopup();
      mockSendMessage.mockClear();
      mockStorageSet.mockRejectedValueOnce(new Error("quota"));

      await choose("badgeScopeCurrent");

      expect(console.error).toHaveBeenCalledWith("Error saving badge scope:", expect.any(Error));
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe("Window names", () => {
    /** Configure two named browser windows with mixed tab states for name-editor tests. */
    const twoWindows = () =>
      setupWindows(
        [
          {
            id: 1,
            name: "Work",
            tabs: [
              { active: true, title: "GitHub" },
              { active: false, title: "Docs" },
              { active: false, title: "Old", discarded: true }
            ]
          },
          { id: 2, tabs: [{ active: true, title: "Inbox" }] }
        ],
        2
      );

    it("lists each window with its number, tab counts and saved name", async () => {
      twoWindows();
      await loadPopup();

      expect($$("#window-list .window-row").length).toBe(2);
      expect($$(".window-num").map((n) => n.textContent)).toEqual(["Win 1", "Win 2"]);
      expect($$(".window-tab-count").map((n) => n.textContent)).toEqual(["(2/3 tabs)", "(1/1 tabs)"]);
      expect($$("input.window-input").map((i) => i.value)).toEqual(["Work", ""]);
      expect($$("input.window-input").map((i) => i.placeholder)).toEqual(["Name (Win1)", "Name (Win2)"]);
    });

    it("shows the active tab title and gives the row a descriptive tooltip", async () => {
      twoWindows();
      await loadPopup();

      expect($$(".window-title").map((t) => t.textContent)).toEqual(["GitHub", "Inbox"]);
      expect($$(".window-row")[0].title).toBe("Window 1: GitHub (2 active / 3 total tabs)");
    });

    it("truncates very long active tab titles but keeps the full title as a tooltip", async () => {
      const longTitle = "A".repeat(40);
      setupWindows([{ id: 1, tabs: [{ active: true, title: longTitle }] }]);
      await loadPopup();

      const titleEl = $(".window-title");
      expect(titleEl.textContent).toBe("A".repeat(25) + "...");
      expect(titleEl.title).toBe(longTitle);
    });

    it("falls back to 'Window N' when there is no active tab title", async () => {
      setupWindows([{ id: 1, tabs: [{ active: false, title: "Hidden" }] }]);
      await loadPopup();
      expect($(".window-title").textContent).toBe("Window 1");
    });

    it("marks only the current window", async () => {
      twoWindows();
      await loadPopup();

      const rows = $$(".window-row");
      expect(rows[0].querySelector(".window-badge")).toBeNull();
      expect(rows[1].querySelector(".window-badge").textContent).toBe("Current");
    });

    it("still lists a window if its tabs cannot be read", async () => {
      mockTabsQuery.mockRejectedValue(new Error("no permission"));
      await loadPopup();

      expect($$(".window-row").length).toBe(1);
      expect($(".window-tab-count").textContent).toBe("(0/0 tabs)");
    });

    it("shows a message when there are no windows", async () => {
      mockWindowsGetAll.mockResolvedValue([]);
      await loadPopup();
      expect($("#window-list").textContent).toBe("No open windows detected.");
    });

    it("shows an error message if the window list cannot be loaded", async () => {
      mockWindowsGetAll.mockRejectedValue(new Error("boom"));
      await loadPopup();
      expect($("#window-list").textContent).toBe("Error loading window list.");
    });

    it("saves a typed name only after a 350ms pause", async () => {
      twoWindows();
      await loadPopup();
      mockSendMessage.mockClear();

      const input = $$("input.window-input")[1];
      input.value = "Home";
      input.dispatchEvent(new Event("input"));

      await jest.advanceTimersByTimeAsync(349);
      expect(mockSetWindowValue).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1);
      expect(mockSetWindowValue).toHaveBeenCalledTimes(1);
      expect(mockSetWindowValue).toHaveBeenCalledWith(2, "windowName", "Home");
      expect(mockSendMessage).toHaveBeenCalledWith({ action: "updateWindowNames" });
      expect(text("#message")).toBe("Window name saved!");
    });

    it("restarts the pause with each keystroke so only the final name is saved", async () => {
      twoWindows();
      await loadPopup();

      const input = $$("input.window-input")[1];
      for (const value of ["H", "Ho", "Hom", "Home"]) {
        input.value = value;
        input.dispatchEvent(new Event("input"));
        await jest.advanceTimersByTimeAsync(200);
      }
      await jest.advanceTimersByTimeAsync(400);

      expect(mockSetWindowValue).toHaveBeenCalledTimes(1);
      expect(mockSetWindowValue).toHaveBeenCalledWith(2, "windowName", "Home");
    });

    it("saves immediately, trimmed, on change and cancels the pending debounce", async () => {
      twoWindows();
      await loadPopup();

      const input = $$("input.window-input")[1];
      input.value = "  Home  ";
      input.dispatchEvent(new Event("input"));
      input.dispatchEvent(new Event("change"));
      await flushPromises();

      expect(mockSetWindowValue).toHaveBeenCalledWith(2, "windowName", "Home");

      await jest.advanceTimersByTimeAsync(1000);
      expect(mockSetWindowValue).toHaveBeenCalledTimes(1);
    });

    it("saves an empty name when the field is cleared, restoring the default label", async () => {
      twoWindows();
      await loadPopup();

      const input = $$("input.window-input")[0];
      input.value = "   ";
      input.dispatchEvent(new Event("change"));
      await flushPromises();

      expect(mockSetWindowValue).toHaveBeenCalledWith(1, "windowName", "");
    });

    it("saves against the correct window id for each row", async () => {
      twoWindows();
      await loadPopup();

      const [first, second] = $$("input.window-input");
      first.value = "One";
      first.dispatchEvent(new Event("change"));
      second.value = "Two";
      second.dispatchEvent(new Event("change"));
      await flushPromises();

      expect(mockSetWindowValue).toHaveBeenCalledWith(1, "windowName", "One");
      expect(mockSetWindowValue).toHaveBeenCalledWith(2, "windowName", "Two");
    });

    it("does not notify the background script if saving a name fails", async () => {
      twoWindows();
      await loadPopup();
      mockSendMessage.mockClear();
      mockSetWindowValue.mockRejectedValueOnce(new Error("no session"));

      const input = $$("input.window-input")[0];
      input.value = "X";
      input.dispatchEvent(new Event("change"));
      await flushPromises();

      expect(console.error).toHaveBeenCalledWith("Failed to save window name for window", 1, expect.any(Error));
      expect(mockSendMessage).not.toHaveBeenCalledWith({ action: "updateWindowNames" });
    });

    it("limits names to 50 characters", async () => {
      twoWindows();
      await loadPopup();
      expect($("input.window-input").maxLength).toBe(50);
    });

    it("renders tab titles as plain text, never as markup", async () => {
      setupWindows([{ id: 1, tabs: [{ active: true, title: "<img src=x onerror=alert(1)>" }] }]);
      await loadPopup();

      expect($("#window-list img")).toBeNull();
      expect($(".window-title").textContent).toContain("<img");
    });
  });
});
