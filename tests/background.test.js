"use strict";

const TST_ID = "treestyletab@piro.sakura.ne.jp";

describe("TST Active and Total Tabs Counter - Background Script", () => {
  let mockSendMessage;
  let mockSetIcon;
  let mockSetBadgeText;
  let mockSetBadgeBackgroundColor;
  let mockSetBadgeTextColor;
  let mockWindowsGetAll;
  let mockTabsQuery;
  let mockStorageLocalSet;
  let mockSessionsGetWindowValue;

  let externalMessageCallback;
  let internalMessageCallback;
  let tabCreatedCallback;
  let tabRemovedCallback;
  let tabUpdatedCallback;
  let windowCreatedCallback;
  let windowRemovedCallback;
  let windowFocusChangedCallback;
  let storageChangedCallback;

  let storageData;
  let sessionData;
  let logSpy;
  let errorSpy;

  const flushPromises = async () => {
    for (let i = 0; i < 50; i++) {
      await Promise.resolve();
    }
  };

  /** Build an array of n tab descriptors, the first `discarded` of which are discarded. */
  const tabs = (n, discarded = 0) =>
    Array.from({ length: n }, (_, i) => ({ discarded: i < discarded }));

  /** Configure windows.getAll / tabs.query from [{ id, tabs: [...] }] definitions. */
  function setupWindows(defs) {
    mockWindowsGetAll.mockResolvedValue(defs.map((d) => ({ id: d.id, type: "normal" })));
    mockTabsQuery.mockImplementation(({ windowId }) => {
      const def = defs.find((d) => d.id === windowId);
      return Promise.resolve(
        def
          ? def.tabs.map((t, i) => ({ id: windowId * 1000 + i, windowId, discarded: !!t.discarded }))
          : []
      );
    });
  }

  /** All set-extra-contents messages sent to TST, optionally filtered to a window. */
  function sidebarCalls(windowId) {
    return mockSendMessage.mock.calls
      .filter(
        ([id, msg]) =>
          id === TST_ID &&
          msg.type === "set-extra-contents" &&
          (windowId === undefined || msg.windowId === windowId)
      )
      .map(([, msg]) => msg);
  }

  /** Last sidebar HTML for a window, flattened to readable single-line text. */
  function sidebarText(windowId) {
    const calls = sidebarCalls(windowId);
    if (!calls.length) return undefined;
    return calls[calls.length - 1].contents
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const registerCalls = () =>
    mockSendMessage.mock.calls.filter(([, msg]) => msg.type === "register-self");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();

    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    storageData = {
      displayStyleOption: "oneLinePerWindow",
      displayOption: "switchToSVG",
      sidebarScopeOption: "all",
      badgeScopeOption: "all"
    };
    sessionData = {};

    mockSendMessage = jest.fn().mockResolvedValue({ success: true });

    const internalMessageCallbacks = [];
    internalMessageCallback = (msg, sender, sendResponse) => {
      internalMessageCallbacks.forEach((cb) => cb(msg, sender, sendResponse));
    };

    const storageGet = jest.fn().mockImplementation((keys) => {
      if (typeof keys === "string") {
        return Promise.resolve(keys in storageData ? { [keys]: storageData[keys] } : {});
      }
      const res = {};
      (keys || Object.keys(storageData)).forEach((k) => {
        if (k in storageData) res[k] = storageData[k];
      });
      return Promise.resolve(res);
    });
    mockStorageLocalSet = jest.fn().mockImplementation((obj) => {
      Object.assign(storageData, obj);
      return Promise.resolve();
    });

    mockSetIcon = jest.fn().mockResolvedValue();
    mockSetBadgeText = jest.fn().mockResolvedValue();
    mockSetBadgeBackgroundColor = jest.fn();
    mockSetBadgeTextColor = jest.fn();

    mockWindowsGetAll = jest.fn();
    mockTabsQuery = jest.fn();
    setupWindows([{ id: 1, tabs: tabs(2, 1) }]);

    mockSessionsGetWindowValue = jest.fn().mockImplementation((windowId, key) =>
      Promise.resolve(sessionData[windowId] && key in sessionData[windowId] ? sessionData[windowId][key] : null)
    );

    global.browser = {
      runtime: {
        sendMessage: mockSendMessage,
        onMessage: { addListener: jest.fn((cb) => internalMessageCallbacks.push(cb)) },
        onMessageExternal: { addListener: jest.fn((cb) => (externalMessageCallback = cb)) }
      },
      storage: {
        local: { get: storageGet, set: mockStorageLocalSet },
        onChanged: { addListener: jest.fn((cb) => (storageChangedCallback = cb)) }
      },
      browserAction: {
        setIcon: mockSetIcon,
        setBadgeText: mockSetBadgeText,
        setBadgeBackgroundColor: mockSetBadgeBackgroundColor,
        setBadgeTextColor: mockSetBadgeTextColor
      },
      windows: {
        WINDOW_ID_NONE: -1,
        getAll: mockWindowsGetAll,
        onCreated: { addListener: jest.fn((cb) => (windowCreatedCallback = cb)) },
        onRemoved: { addListener: jest.fn((cb) => (windowRemovedCallback = cb)) },
        onFocusChanged: { addListener: jest.fn((cb) => (windowFocusChangedCallback = cb)) }
      },
      tabs: {
        query: mockTabsQuery,
        onCreated: { addListener: jest.fn((cb) => (tabCreatedCallback = cb)) },
        onRemoved: { addListener: jest.fn((cb) => (tabRemovedCallback = cb)) },
        onUpdated: { addListener: jest.fn((cb) => (tabUpdatedCallback = cb)) }
      },
      sessions: { getWindowValue: mockSessionsGetWindowValue }
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  async function loadBackground() {
    require("../background.js");
    await flushPromises();
  }

  describe("Startup and Initialization", () => {
    it("sets badge background and text colors", async () => {
      await loadBackground();
      expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({ color: "#808080" });
      expect(mockSetBadgeTextColor).toHaveBeenCalledWith({ color: "#ffffff" });
    });

    it("registers every expected event listener", async () => {
      await loadBackground();
      expect(browser.tabs.onCreated.addListener).toHaveBeenCalled();
      expect(browser.tabs.onRemoved.addListener).toHaveBeenCalled();
      expect(browser.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(browser.windows.onCreated.addListener).toHaveBeenCalled();
      expect(browser.windows.onRemoved.addListener).toHaveBeenCalled();
      expect(browser.windows.onFocusChanged.addListener).toHaveBeenCalled();
      expect(browser.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(browser.runtime.onMessageExternal.addListener).toHaveBeenCalled();
      expect(browser.storage.onChanged.addListener).toHaveBeenCalled();
    });

    it("registers with TST, listening for the events it needs and injecting CSS", async () => {
      await loadBackground();
      const [id, msg] = registerCalls()[0];
      expect(id).toBe(TST_ID);
      expect(msg).toEqual(
        expect.objectContaining({
          type: "register-self",
          name: "TST Active and Total Tabs Counter",
          listeningTypes: ["ready", "tabbar-updated", "sidebar-show"],
          style: expect.stringContaining(".newtab-button")
        })
      );
    });

    it("retries registration with TST 15 times, once per second", async () => {
      await loadBackground();
      await jest.advanceTimersByTimeAsync(15000);
      expect(registerCalls().length).toBe(15);
    });

    it("only queries normal browser windows", async () => {
      await loadBackground();
      expect(mockWindowsGetAll).toHaveBeenCalledWith({ windowTypes: ["normal"] });
    });

    it("writes the default layout to storage and uses defaults when storage is empty", async () => {
      storageData = {};
      setupWindows([{ id: 1, tabs: tabs(3) }]);
      await loadBackground();

      expect(mockStorageLocalSet).toHaveBeenCalledWith({ displayStyleOption: "oneLinePerWindow" });
      expect(mockSetBadgeText).toHaveBeenCalledWith(expect.objectContaining({ text: "3" }));
      expect(sidebarText(1)).toBe("Total: 3 / 3 tabs");
    });

    it("keeps working when TST is not installed (sendMessage rejects)", async () => {
      mockSendMessage.mockRejectedValue(new Error("Could not establish connection"));
      setupWindows([{ id: 1, tabs: tabs(3) }]);
      await loadBackground();

      expect(mockSetBadgeText).toHaveBeenCalledWith(expect.objectContaining({ text: "3" }));
      expect(errorSpy).not.toHaveBeenCalledWith("Failed to update tab count", expect.anything());
    });

    it("logs an error instead of throwing if the window query fails", async () => {
      mockWindowsGetAll.mockRejectedValue(new Error("boom"));
      await loadBackground();
      expect(errorSpy).toHaveBeenCalledWith("Failed to update tab count", expect.any(Error));
    });
  });

  describe("Tree Style Tab external messaging", () => {
    it("ignores messages from other extensions", async () => {
      await loadBackground();
      mockSendMessage.mockClear();

      externalMessageCallback({ type: "ready" }, { id: "evil@example.com" });
      await flushPromises();

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it.each(["ready", "tabbar-updated", "sidebar-show"])(
      "re-registers when TST sends '%s'",
      async (type) => {
        await loadBackground();
        mockSendMessage.mockClear();

        externalMessageCallback({ type }, { id: TST_ID });
        await flushPromises();

        expect(registerCalls().length).toBe(1);
      }
    );

    it("does not re-register for unrelated TST message types", async () => {
      await loadBackground();
      mockSendMessage.mockClear();

      externalMessageCallback({ type: "tab-mousedown" }, { id: TST_ID });
      await flushPromises();

      expect(registerCalls().length).toBe(0);
    });
  });

  describe("Native badge display", () => {
    it("shows the total tab count (including discarded tabs) with the default icon", async () => {
      setupWindows([{ id: 1, tabs: tabs(3, 1) }]);
      await loadBackground();

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: "3", windowId: undefined });
      expect(mockSetIcon).toHaveBeenCalledWith({ path: "images/icon.png", windowId: undefined });
    });

    it("sums tabs across all windows when badge scope is 'all'", async () => {
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(3) }
      ]);
      await loadBackground();

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: "5", windowId: undefined });
    });

    it("clears any per-window badge override when badge scope is 'all'", async () => {
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(3) }
      ]);
      await loadBackground();

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: null, windowId: 1 });
      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: null, windowId: 2 });
      expect(mockSetIcon).toHaveBeenCalledWith({ path: null, windowId: 1 });
      expect(mockSetIcon).toHaveBeenCalledWith({ path: null, windowId: 2 });
    });

    it("shows a separate count per window when badge scope is 'current'", async () => {
      storageData.badgeScopeOption = "current";
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(3) }
      ]);
      await loadBackground();

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: "2", windowId: 1 });
      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: "3", windowId: 2 });
      expect(mockSetBadgeText).not.toHaveBeenCalledWith({ text: "5", windowId: undefined });
    });

    it.each([
      [999, "999"],
      [5, "5"]
    ])("with %i tabs the native badge reads %s and no SVG is used", async (count, expected) => {
      setupWindows([{ id: 1, tabs: tabs(count) }]);
      await loadBackground();
      expect(mockSetBadgeText).toHaveBeenCalledWith(expect.objectContaining({ text: expected }));
      expect(mockSetIcon).not.toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining("data:image/svg+xml") })
      );
    });

    it.each(["", "nativeBadge"])(
      "treats a stored display option of %j like the popup's 'Native Badge + SVG' default",
      async (stored) => {
        if (stored) storageData.displayOption = stored;
        else delete storageData.displayOption;
        setupWindows([{ id: 1, tabs: tabs(1200) }]);
        await loadBackground();

        expect(errorSpy).not.toHaveBeenCalledWith("Unknown display option:", expect.anything());
        expect(mockSetBadgeText).toHaveBeenCalledWith({ text: "", windowId: undefined });
        expect(mockSetIcon).toHaveBeenCalledWith(
          expect.objectContaining({ path: expect.stringContaining("data:image/svg+xml") })
        );
      }
    );
  });

  describe("SVG badge display", () => {
    const decodeIcon = (path) => decodeURIComponent(path.slice(path.indexOf(",") + 1));
    const svgIconCalls = () =>
      mockSetIcon.mock.calls
        .map(([details]) => details)
        .filter((d) => typeof d.path === "string" && d.path.startsWith("data:image/svg+xml"));

    it("switchToSVG keeps the native badge at 999 tabs", async () => {
      storageData.displayOption = "switchToSVG";
      setupWindows([{ id: 1, tabs: tabs(999) }]);
      await loadBackground();

      expect(mockSetBadgeText).toHaveBeenCalledWith(expect.objectContaining({ text: "999" }));
      expect(svgIconCalls()).toHaveLength(0);
    });

    it("switchToSVG switches to an SVG icon and clears the badge text at 1000 tabs", async () => {
      storageData.displayOption = "switchToSVG";
      setupWindows([{ id: 1, tabs: tabs(1000) }]);
      await loadBackground();

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: "", windowId: undefined });
      expect(svgIconCalls().length).toBeGreaterThan(0);
      expect(decodeIcon(svgIconCalls()[0].path)).toContain(">1000</text>");
    });

    it("alwaysSVG renders an SVG icon even for a single tab", async () => {
      storageData.displayOption = "alwaysSVG";
      setupWindows([{ id: 1, tabs: tabs(1) }]);
      await loadBackground();

      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: "", windowId: undefined });
      expect(decodeIcon(svgIconCalls()[0].path)).toContain(">1</text>");
    });

    it.each([
      [5, '<rect x="40" '],
      [42, '<rect x="25" '],
      [420, '<rect x="4" '],
      [1500, '<rect x="0" ']
    ])("alwaysSVG with %i tabs uses the matching backing-rectangle width", async (count, rect) => {
      storageData.displayOption = "alwaysSVG";
      setupWindows([{ id: 1, tabs: tabs(count) }]);
      await loadBackground();

      const svg = decodeIcon(svgIconCalls()[0].path);
      expect(svg).toContain(rect);
      expect(svg).toContain(`>${count}</text>`);
    });

    it("alwaysSVG applies the icon to a specific window when badge scope is 'current'", async () => {
      storageData.displayOption = "alwaysSVG";
      storageData.badgeScopeOption = "current";
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(3) }
      ]);
      await loadBackground();

      const windowIds = svgIconCalls().map((d) => d.windowId);
      expect(windowIds).toEqual(expect.arrayContaining([1, 2]));
    });

    it("logs an error for an unknown display option", async () => {
      storageData.displayOption = "bogus";
      await loadBackground();
      expect(errorSpy).toHaveBeenCalledWith("Unknown display option:", "bogus");
    });
  });

  describe("Sidebar: one line per window", () => {
    it("shows loaded / total tabs, treating discarded tabs as not loaded", async () => {
      setupWindows([{ id: 1, tabs: tabs(10, 4) }]);
      await loadBackground();
      expect(sidebarText(1)).toBe("Total: 6 / 10 tabs");
    });

    it("lists each window plus a Total row, marking the receiving window with *", async () => {
      setupWindows([
        { id: 1, tabs: tabs(2, 1) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();

      expect(sidebarText(1)).toBe("*Win1: 1 / 2 tabs Win2: 1 / 1 tabs Total: 2 / 3 tabs");
      expect(sidebarText(2)).toBe("Win1: 1 / 2 tabs *Win2: 1 / 1 tabs Total: 2 / 3 tabs");
    });

    it("sends a fallback update without a windowId and without any * marker", async () => {
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();

      const fallback = mockSendMessage.mock.calls
        .map(([, msg]) => msg)
        .find((m) => m.type === "set-extra-contents" && m.windowId === undefined);
      expect(fallback).toBeDefined();
      expect(fallback.place).toBe("new-tab-button");
      expect(fallback.contents).not.toContain("*");
    });

    it("omits the Total row and names a lone window 'Total'", async () => {
      setupWindows([{ id: 1, tabs: tabs(2) }]);
      await loadBackground();
      expect(sidebarText(1)).toBe("Total: 2 / 2 tabs");
    });

    it("current-window scope shows only that window's own counts", async () => {
      storageData.sidebarScopeOption = "current";
      setupWindows([
        { id: 1, tabs: tabs(2, 1) },
        { id: 2, tabs: tabs(3) }
      ]);
      await loadBackground();

      expect(sidebarText(1)).toBe("Win1: 1 / 2 tabs");
      expect(sidebarText(2)).toBe("Win2: 3 / 3 tabs");
    });

    it("current-window scope names a lone window 'Total'", async () => {
      storageData.sidebarScopeOption = "current";
      setupWindows([{ id: 1, tabs: tabs(4) }]);
      await loadBackground();
      expect(sidebarText(1)).toBe("Total: 4 / 4 tabs");
    });

    it("current-window scope never sends a fallback update without a windowId", async () => {
      storageData.sidebarScopeOption = "current";
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(3) }
      ]);
      await loadBackground();

      expect(sidebarCalls().every((m) => m.windowId !== undefined)).toBe(true);
    });
  });

  describe("Sidebar: compact view", () => {
    beforeEach(() => {
      storageData.displayStyleOption = "compactView";
    });

    it("joins windows inline, ends with a T total and marks the receiving window", async () => {
      setupWindows([
        { id: 1, tabs: tabs(2, 1) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();

      expect(sidebarText(1)).toBe("*W1: 1/2, W2: 1/1, T: 2/3");
      expect(sidebarText(2)).toBe("W1: 1/2, *W2: 1/1, T: 2/3");
    });

    it("current-window scope shows only the window's own compact count", async () => {
      storageData.sidebarScopeOption = "current";
      setupWindows([
        { id: 1, tabs: tabs(2, 1) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();

      expect(sidebarText(1)).toBe("W1: 1/2");
      expect(sidebarText(2)).toBe("W2: 1/1");
    });

    it("current-window scope labels a lone window 'T'", async () => {
      storageData.sidebarScopeOption = "current";
      setupWindows([{ id: 1, tabs: tabs(2, 1) }]);
      await loadBackground();
      expect(sidebarText(1)).toBe("T: 1/2");
    });

    it("all-windows scope with a single window shows just 'T: loaded/total' without duplicating", async () => {
      storageData.sidebarScopeOption = "all";
      setupWindows([{ id: 1, tabs: tabs(2, 1) }]);
      await loadBackground();
      expect(sidebarText(1)).toBe("T: 1/2");
    });

    it("all-windows scope with a single custom-named window shows just 'Name: loaded/total'", async () => {
      storageData.sidebarScopeOption = "all";
      sessionData[1] = { windowName: "Personal" };
      setupWindows([{ id: 1, tabs: tabs(4, 1) }]);
      await loadBackground();
      expect(sidebarText(1)).toBe("Personal: 3/4");
    });
  });

  describe("Custom window names", () => {
    it("replaces the default label with the custom name", async () => {
      sessionData[1] = { windowName: "Work" };
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();
      expect(sidebarText(1)).toBe("*Work: 2 / 2 tabs Win2: 1 / 1 tabs Total: 3 / 3 tabs");
    });

    it("uses custom names in compact view too", async () => {
      storageData.displayStyleOption = "compactView";
      sessionData[2] = { windowName: "Home" };
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();
      expect(sidebarText(1)).toBe("*W1: 2/2, Home: 1/1, T: 3/3");
    });

    it("trims whitespace around a custom name", async () => {
      sessionData[1] = { windowName: "  Work  " };
      await loadBackground();
      expect(sidebarText(1)).toBe("Work: 1 / 2 tabs");
    });

    it.each(["", "   ", null, 42])("falls back to the default name for %j", async (value) => {
      sessionData[1] = { windowName: value };
      setupWindows([
        { id: 1, tabs: tabs(1) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();
      expect(sidebarText(1)).toContain("*Win1:");
    });

    it("falls back to the default name when reading the stored name fails", async () => {
      mockSessionsGetWindowValue.mockRejectedValue(new Error("no session"));
      setupWindows([
        { id: 1, tabs: tabs(1) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();
      expect(sidebarText(1)).toContain("*Win1:");
    });

    it("HTML-escapes custom names so they cannot inject markup", async () => {
      sessionData[1] = { windowName: `<img src=x onerror="alert('x')"> & Co` };
      await loadBackground();

      const html = sidebarCalls(1).pop().contents;
      expect(html).not.toContain("<img");
      expect(html).toContain("&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; Co");
    });
  });

  describe("Tab and window lifecycle events", () => {
    it("recounts on tab creation", async () => {
      await loadBackground();
      mockTabsQuery.mockClear();
      tabCreatedCallback({ id: 999, windowId: 1 });
      await flushPromises();
      expect(mockTabsQuery).toHaveBeenCalled();
    });

    it("excludes the closing tab immediately, then recounts again after 100ms", async () => {
      setupWindows([{ id: 1, tabs: tabs(3) }]);
      await loadBackground();
      mockSendMessage.mockClear();

      tabRemovedCallback(1000, { windowId: 1 });
      await flushPromises();
      expect(sidebarText(1)).toBe("Total: 2 / 2 tabs");

      mockTabsQuery.mockClear();
      await jest.advanceTimersByTimeAsync(100);
      expect(mockTabsQuery).toHaveBeenCalled();
    });

    it("recounts when a tab is discarded or restored", async () => {
      await loadBackground();
      mockTabsQuery.mockClear();
      tabUpdatedCallback(1000, { discarded: true });
      await flushPromises();
      expect(mockTabsQuery).toHaveBeenCalled();
    });

    it("ignores tab updates that do not involve discarding", async () => {
      await loadBackground();
      mockTabsQuery.mockClear();
      tabUpdatedCallback(1000, { title: "New title", status: "complete" });
      await flushPromises();
      expect(mockTabsQuery).not.toHaveBeenCalled();
    });

    it.each([
      ["created", () => windowCreatedCallback({ id: 2 })],
      ["removed", () => windowRemovedCallback(2)]
    ])("re-registers with TST and recounts when a window is %s", async (_, trigger) => {
      await loadBackground();
      mockSendMessage.mockClear();
      mockTabsQuery.mockClear();

      trigger();
      await flushPromises();

      expect(registerCalls().length).toBeGreaterThan(0);
      expect(mockTabsQuery).toHaveBeenCalled();
    });

    it("recounts when window focus changes so the * marker stays accurate", async () => {
      await loadBackground();
      mockTabsQuery.mockClear();
      windowFocusChangedCallback(1);
      await flushPromises();
      expect(mockTabsQuery).toHaveBeenCalled();
    });

    it("ignores focus changes to WINDOW_ID_NONE (focus left the browser)", async () => {
      await loadBackground();
      mockTabsQuery.mockClear();
      windowFocusChangedCallback(-1);
      await flushPromises();
      expect(mockTabsQuery).not.toHaveBeenCalled();
    });
  });

  describe("Runtime messages and storage changes", () => {
    it.each(["updateBadge", "updateWindowNames", "updateSidebarScope", "updateBadgeScope"])(
      "'%s' triggers a recount and responds 'Updated'",
      async (action) => {
        await loadBackground();
        mockTabsQuery.mockClear();
        const sendResponse = jest.fn();

        internalMessageCallback({ action }, {}, sendResponse);
        await flushPromises();

        expect(mockTabsQuery).toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith({ result: "Updated" });
      }
    );

    it("ignores unknown runtime message actions", async () => {
      await loadBackground();
      mockTabsQuery.mockClear();
      const sendResponse = jest.fn();

      internalMessageCallback({ action: "somethingElse" }, {}, sendResponse);
      await flushPromises();

      expect(mockTabsQuery).not.toHaveBeenCalled();
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it("switches to compact layout when setTabCountMethod 2 arrives after the popup saved it", async () => {
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();
      expect(sidebarText(1)).toContain("Win1:");

      storageData.displayStyleOption = "compactView";
      internalMessageCallback({ action: "setTabCountMethod", tabCountMethod: 2 }, {}, jest.fn());
      await flushPromises();

      expect(sidebarText(1)).toBe("*W1: 2/2, W2: 1/1, T: 3/3");
    });

    it("switches back to one-line layout when setTabCountMethod 1 arrives", async () => {
      storageData.displayStyleOption = "compactView";
      setupWindows([
        { id: 1, tabs: tabs(2) },
        { id: 2, tabs: tabs(1) }
      ]);
      await loadBackground();
      expect(sidebarText(1)).toContain("W1:");

      storageData.displayStyleOption = "oneLinePerWindow";
      internalMessageCallback({ action: "setTabCountMethod", tabCountMethod: 1 }, {}, jest.fn());
      await flushPromises();

      expect(sidebarText(1)).toContain("*Win1:");
    });

    it.each(["sidebarScopeOption", "badgeScopeOption", "displayStyleOption", "displayOption"])(
      "recounts when '%s' changes in local storage",
      async (key) => {
        await loadBackground();
        mockTabsQuery.mockClear();
        storageChangedCallback({ [key]: { newValue: "x" } }, "local");
        await flushPromises();
        expect(mockTabsQuery).toHaveBeenCalled();
      }
    );

    it("ignores unrelated storage keys such as pageTheme", async () => {
      await loadBackground();
      mockTabsQuery.mockClear();
      storageChangedCallback({ pageTheme: { newValue: "dark" } }, "local");
      await flushPromises();
      expect(mockTabsQuery).not.toHaveBeenCalled();
    });

    it("ignores storage changes outside the local area", async () => {
      await loadBackground();
      mockTabsQuery.mockClear();
      storageChangedCallback({ sidebarScopeOption: { newValue: "current" } }, "sync");
      await flushPromises();
      expect(mockTabsQuery).not.toHaveBeenCalled();
    });
  });
});
