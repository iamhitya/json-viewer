import React, { useCallback, useEffect, useRef, useState } from "react";
import Split from "@uiw/react-split";
import GitHubCorners from "@uiw/react-github-corners";
import JsonViewer from "@uiw/react-json-view";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { json as jsonLang } from "@codemirror/lang-json";
import { createHashHistory } from "history";
import styles from "./App.module.css";

type Parameters = {
  json?: string;
  cornerhref?: string;
  hidenheader?: "1" | "0";
  corner?: "1" | "0";
  view?: "preview" | "editor";
};
type ViewMode = "split" | "editor" | "preview";
const history = createHashHistory();
const getURLParameters = (url: string): Parameters =>
  ((url.match(/([^?=&]+)(=([^&]*))/g) || []) as any).reduce(
    (a: any, v: string) => (
      (a[v.slice(0, v.indexOf("="))] = v.slice(v.indexOf("=") + 1)),
      a
    ),
    {},
  );
const objectToQueryString = (queryParameters: Parameters) => {
  return queryParameters
    ? Object.entries(queryParameters).reduce(
        (queryString, [key, val], index) => {
          const symbol = queryString.length === 0 ? "?" : "&";
          queryString +=
            typeof val === "string" ? `${symbol}${key}=${val}` : "";
          return queryString;
        },
        "",
      )
    : "";
};

const App = () => {
  const param = getURLParameters(window.location.href);
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  param.json = param.json ? decodeURI(param.json) : undefined;
  const [code, setCode] = useState(decodeURIComponent(param.json || ""));
  const [json, setJson] = useState();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [linebar, setLinebar] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(param.view ?? "split");

  const handleJson = useCallback(() => {
    setMessage("");
    setStatus("");
    try {
      if (code) {
        const obj = JSON.parse(code);
        setJson(obj);
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
  };

  const handleLoadSample = () => {
    const sample = JSON.stringify(
      {
        name: "JSON Viewer",
        version: 1,
        active: true,
        tags: ["viewer", "json"],
        items: [{ id: 1 }, { id: 2 }],
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

  const resolvedView: ViewMode = param.view ?? viewMode;
  const viewLocked = Boolean(param.view);
  const showEditor = resolvedView === "editor" || resolvedView === "split";
  const showPreview = resolvedView === "preview" || resolvedView === "split";

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
        <JsonViewer value={json!} style={{}} displayDataTypes={false} />
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
