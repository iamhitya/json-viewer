import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Split from "@uiw/react-split";
import GitHubCorners from "@uiw/react-github-corners";
import JsonViewer from "@uiw/react-json-view";
import type { SemicolonProps } from "@uiw/react-json-view";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { json as jsonLang } from "@codemirror/lang-json";
import styles from "./App.module.css";

type Parameters = {
  json?: string;
  cornerhref?: string;
  hidenheader?: "1" | "0";
  corner?: "1" | "0";
  view?: "preview" | "editor";
};
type ViewMode = "split" | "editor" | "preview";

interface SearchMatch {
  path: Array<string | number>;
  type: "key" | "value";
  value: unknown;
  keyName?: string | number;
}

const getURLParameters = (url: string): Parameters =>
  ((url.match(/([^?=&]+)(=([^&]*))/g) || []) as any).reduce(
    (a: any, v: string) => {
      a[v.slice(0, v.indexOf("="))] = v.slice(v.indexOf("=") + 1);
      return a;
    },
    {},
  );

const findMatches = (
  obj: unknown,
  searchTerm: string,
  path: Array<string | number> = [],
): SearchMatch[] => {
  if (!searchTerm.trim()) return [];

  const matches: SearchMatch[] = [];
  const lowerSearchTerm = searchTerm.toLowerCase();

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const newPath = [...path, index];
      matches.push(...findMatches(item, searchTerm, newPath));
    });
  } else if (obj !== null && typeof obj === "object") {
    Object.entries(obj as Record<string, unknown>).forEach(
      ([key, value]) => {
        const newPath = [...path, key];

        if (key.toLowerCase().includes(lowerSearchTerm)) {
          matches.push({
            path: newPath,
            type: "key",
            value,
            keyName: key,
          });
        }

        matches.push(...findMatches(value, searchTerm, newPath));
      },
    );
  } else {
    const valueStr = String(obj);
    if (valueStr.toLowerCase().includes(lowerSearchTerm)) {
      matches.push({
        path,
        type: "value",
        value: obj,
      });
    }
  }

  return matches;
};

const pathsMatch = (
  path1: Array<string | number>,
  path2: Array<string | number>,
): boolean => {
  if (path1.length !== path2.length) return false;
  return path1.every((p, i) => p === path2[i]);
};

const App = () => {
  const param = getURLParameters(window.location.href);
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  param.json = param.json ? decodeURI(param.json) : undefined;
  const [code, setCode] = useState(decodeURIComponent(param.json || ""));
  const [json, setJson] = useState<unknown>();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [linebar, setLinebar] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(param.view ?? "split");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const handleJson = useCallback(() => {
    setMessage("");
    setStatus("");
    try {
      if (code) {
        const obj = JSON.parse(code);
        setJson(obj);
      } else {
        setJson(undefined);
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
        setJson(undefined);
      } else {
        throw error;
      }
    }
  }, [code]);

  const formatJson = useCallback(
    (_: any, replacer: number = 2) => {
      setMessage("");
      setStatus("");
      try {
        if (code) {
          const obj = JSON.parse(code);
          const str = JSON.stringify(obj, null, replacer);
          setCode(str);
        }
      } catch (error) {
        if (error instanceof Error) {
          setMessage(error.message);
          setJson(undefined);
        } else {
          throw error;
        }
      }
    },
    [code],
  );

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied to clipboard");
    } catch (error) {
      setStatus("Copy failed");
    }
  };

  const handleClear = () => {
    setCode("");
    setJson(undefined);
    setMessage("");
    setStatus("Cleared");
    setSearchTerm("");
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  };

  const handleLoadSample = () => {
    const sample = JSON.stringify(
      {
        name: "JSON Viewer",
        version: 1,
        active: true,
        tags: ["viewer", "json"],
        items: [{ id: 1 }, { id: 2 }],
        config: {
          theme: "light",
          fontSize: 14,
          autoSave: true,
        },
      },
      null,
      2,
    );
    setCode(sample);
    setStatus("Loaded sample");
  };

  useEffect(() => {
    handleJson();
  }, [code, handleJson]);

  useEffect(() => {
    if (json && searchTerm.trim()) {
      const matches = findMatches(json, searchTerm);
      setSearchMatches(matches);
      setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
    } else {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
    }
  }, [json, searchTerm]);

  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex =
      currentMatchIndex >= searchMatches.length - 1 ? 0 : currentMatchIndex + 1;
    setCurrentMatchIndex(nextIndex);
  };

  const goToPrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex =
      currentMatchIndex <= 0 ? searchMatches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  };

  const resolvedView: ViewMode = param.view ?? viewMode;
  const viewLocked = Boolean(param.view);
  const showEditor = resolvedView === "editor" || resolvedView === "split";
  const showPreview = resolvedView === "preview" || resolvedView === "split";

  const customComponents = useMemo(() => {
    const isCurrentMatch = (
      namespace: Array<string | number> | undefined,
      keyName: string | number | undefined,
      type: "key" | "value",
    ): boolean => {
      if (currentMatchIndex < 0 || !namespace) return false;
      const currentMatch = searchMatches[currentMatchIndex];
      if (!currentMatch) return false;

      if (currentMatch.type !== type) return false;

      if (type === "key") {
        return (
          pathsMatch(namespace, currentMatch.path) &&
          keyName === currentMatch.keyName
        );
      }

      return pathsMatch(namespace, currentMatch.path);
    };

    const isMatch = (
      namespace: Array<string | number> | undefined,
      keyName: string | number | undefined,
      type: "key" | "value",
      value?: unknown,
    ): boolean => {
      if (!searchTerm.trim() || !namespace) return false;

      return searchMatches.some((match) => {
        if (match.type !== type) return false;

        if (type === "key") {
          return (
            pathsMatch(namespace, match.path) && keyName === match.keyName
          );
        }

        return pathsMatch(namespace, match.path);
      });
    };

    return {
      objectKey: (props: SemicolonProps) => {
        const { keyName, namespace, children } = props;
        const isCurrent = isCurrentMatch(namespace, keyName, "key");
        const isMatched = isMatch(namespace, keyName, "key");

        if (!isMatched || !searchTerm.trim()) {
          return <>{children}</>;
        }

        return (
          <span
            className={
              isCurrent ? styles.searchCurrentMatch : styles.searchHighlight
            }
          >
            {children}
          </span>
        );
      },
      value: (props: any) => {
        const { value, namespace, children } = props;
        const isCurrent = isCurrentMatch(namespace, undefined, "value");
        const isMatched = isMatch(namespace, undefined, "value", value);

        if (!isMatched || !searchTerm.trim()) {
          return <>{children}</>;
        }

        return (
          <span
            className={
              isCurrent ? styles.searchCurrentMatch : styles.searchHighlight
            }
          >
            {children}
          </span>
        );
      },
    };
  }, [searchTerm, searchMatches, currentMatchIndex]);

  const editor = (
    <div
      className={
        resolvedView === "editor"
          ? `${styles.editorPane} ${styles.editorFull}`
          : styles.editorPane
      }
    >
      <div className={styles.editorWrapper}>
        <CodeMirror
          value={code}
          ref={cmRef}
          height="100%"
          style={{ height: "100%" }}
          extensions={[jsonLang()]}
          placeholder="Paste your JSON here or click Sample to load example..."
          onUpdate={(cm) => {
            if (param.hidenheader === "1") {
              return;
            }
            const { selection } = cm.state;
            const line = cm.view.state.doc.lineAt(selection.main.from);
            setLinebar(
              `Line ${line.number}/${cm.state.doc.lines}, Column ${cm.state.selection.main.head - line.from + 1}`,
            );
            const text = cm.state.sliceDoc(
              selection.main.from,
              selection.main.to,
            );
            if (text) {
              if (selection.ranges.length > 1) {
                setLinebar(`${selection.ranges.length} selection regions`);
              } else {
                setLinebar(
                  `${text.split("\n").length} lines, ${text.length} characters selected`,
                );
              }
            }
          }}
          onChange={(value, viewUpdate) => {
            setCode(value);
          }}
        />
      </div>
    </div>
  );

  const preview = (
    <div
      className={
        resolvedView === "preview"
          ? `${styles.previewPane} ${styles.previewFull}`
          : styles.previewPane
      }
    >
      {message && <pre className={styles.previewError}>{message}</pre>}
      {json && typeof json == "object" && (
        <JsonViewer
          value={json!}
          style={{}}
          displayDataTypes={false}
          components={customComponents}
        />
      )}
    </div>
  );

  return (
    <div className={styles.app}>
      {!Number(param.corner) && (
        <GitHubCorners
          fixed
          zIndex={999}
          size={43}
          target="__blank"
          href={
            param.cornerhref
              ? param.cornerhref
              : "https://github.com/iamhitya/json-viewer"
          }
        />
      )}
      <Split mode="vertical" visiable={false}>
        {param.hidenheader !== "1" && (
          <div className={styles.header}>
            <div className={styles.title}>JSON Viewer</div>
            <div className={styles.toolbar}>
              <div className={styles.meta}>
                {linebar && <span className={styles.linebar}> {linebar} </span>}
                {message && <span className={styles.message}>{message}</span>}
                {!message && status && (
                  <span className={styles.status}>{status}</span>
                )}
              </div>
              <div className={styles.controls}>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search in JSON..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (e.shiftKey) {
                          goToPrevMatch();
                        } else {
                          goToNextMatch();
                        }
                      }
                      if (e.key === "Escape") {
                        clearSearch();
                      }
                    }}
                  />
                  {searchTerm && (
                    <span className={styles.searchCount}>
                      {searchMatches.length > 0
                        ? `${currentMatchIndex + 1}/${searchMatches.length}`
                        : "0/0"}
                    </span>
                  )}
                  <button
                    className={styles.searchNavBtn}
                    onClick={goToPrevMatch}
                    disabled={searchMatches.length === 0}
                    title="Previous match (Shift+Enter)"
                  >
                    ↑
                  </button>
                  <button
                    className={styles.searchNavBtn}
                    onClick={goToNextMatch}
                    disabled={searchMatches.length === 0}
                    title="Next match (Enter)"
                  >
                    ↓
                  </button>
                  {searchTerm && (
                    <button
                      className={styles.searchClearBtn}
                      onClick={clearSearch}
                      title="Clear search (Esc)"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className={styles.segment}>
                  <button
                    className={resolvedView === "split" ? styles.active : ""}
                    onClick={() => setViewMode("split")}
                    disabled={viewLocked}
                    title={viewLocked ? "View is locked by URL" : "Split view"}
                  >
                    Split
                  </button>
                  <button
                    className={resolvedView === "editor" ? styles.active : ""}
                    onClick={() => setViewMode("editor")}
                    disabled={viewLocked}
                    title={viewLocked ? "View is locked by URL" : "Editor only"}
                  >
                    Editor
                  </button>
                  <button
                    className={resolvedView === "preview" ? styles.active : ""}
                    onClick={() => setViewMode("preview")}
                    disabled={viewLocked}
                    title={
                      viewLocked ? "View is locked by URL" : "Preview only"
                    }
                  >
                    Preview
                  </button>
                </div>
                <div className={styles.btn}>
                  <button onClick={handleLoadSample}>Sample</button>
                  <button onClick={formatJson} disabled={!code}>
                    Format
                  </button>
                  <button onClick={() => formatJson(null, 0)} disabled={!code}>
                    Compress
                  </button>
                  <button onClick={handleCopy} disabled={!code}>
                    Copy
                  </button>
                  <button onClick={handleClear} disabled={!code}>
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <Split
          style={{
            flex: 1,
            height: param.hidenheader !== "1" ? "calc(100% - 32px)" : "100%",
          }}
        >
          {showEditor && editor}
          {showPreview && preview}
        </Split>
      </Split>
    </div>
  );
};

export default App;
