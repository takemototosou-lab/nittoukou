import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { createArtisanCorrection, normalizeFivePrimaryRatio, PRIMARY_KEYS } from "./artisanCorrection.js";
import { findColorByCode, rgbToFivePrimaries } from "./nittoColorMaster.js";

const STORAGE_KEY = "jpma-artisan-corrections:v1";

const ratioRows = [
  { key: "white", label: "白" },
  { key: "black", label: "黒" },
  { key: "red", label: "赤" },
  { key: "yellow", label: "黄" },
  { key: "blue", label: "青" },
];

const emptyRatio = { white: 0, black: 0, red: 0, yellow: 0, blue: 0 };

function readCorrections() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function readCorrection(code) {
  return readCorrections()[code] || null;
}

function writeCorrection(correction) {
  const corrections = readCorrections();
  corrections[correction.code] = correction;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));
}

function ratioTotal(ratio) {
  return PRIMARY_KEYS.reduce((sum, key) => sum + Number(ratio?.[key] || 0), 0);
}

function ratioFromCorrection(correction) {
  if (!correction) return null;
  return normalizeFivePrimaryRatio(correction);
}

function App() {
  const [input, setInput] = useState("22-75B");
  const [color, setColor] = useState(null);
  const [aiRatio, setAiRatio] = useState(null);
  const [correctionForm, setCorrectionForm] = useState(emptyRatio);
  const [memo, setMemo] = useState("");
  const [savedCorrection, setSavedCorrection] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");

  const correctedRatio = useMemo(() => {
    if (!aiRatio) return null;
    return normalizeFivePrimaryRatio(correctionForm);
  }, [aiRatio, correctionForm]);

  const aiTotal = useMemo(() => ratioTotal(aiRatio), [aiRatio]);
  const correctedTotal = useMemo(() => ratioTotal(correctedRatio), [correctedRatio]);

  function loadColor(foundColor) {
    const nextAiRatio = rgbToFivePrimaries(foundColor.r, foundColor.g, foundColor.b);
    const storedCorrection = readCorrection(foundColor.code);
    const storedRatio = ratioFromCorrection(storedCorrection);

    setColor(foundColor);
    setAiRatio(nextAiRatio);
    setCorrectionForm(storedRatio || nextAiRatio);
    setMemo(storedCorrection?.memo || "");
    setSavedCorrection(storedCorrection);
    setSaveMessage(storedCorrection ? "保存済みの職人補正を読み込みました。" : "");
  }

  function handleSearch() {
    const foundColor = findColorByCode(input);
    if (!foundColor) {
      setColor(null);
      setAiRatio(null);
      setCorrectionForm(emptyRatio);
      setMemo("");
      setSavedCorrection(null);
      setSaveMessage("");
      setError("日塗工番号が見つかりません。");
      return;
    }
    loadColor(foundColor);
    setError("");
  }

  function handleReset() {
    setInput("");
    setColor(null);
    setAiRatio(null);
    setCorrectionForm(emptyRatio);
    setMemo("");
    setSavedCorrection(null);
    setSaveMessage("");
    setError("");
  }

  function handleCorrectionChange(key, value) {
    setCorrectionForm((current) => ({
      ...current,
      [key]: value,
    }));
    setSaveMessage("");
  }

  function handleSaveCorrection() {
    if (!color || !correctedRatio) return;
    const correction = createArtisanCorrection(color.code, correctedRatio, memo);
    writeCorrection(correction);
    setCorrectionForm(correction);
    setSavedCorrection(correction);
    setSaveMessage("職人補正を保存しました。");
  }

  return (
    <main className="appShell">
      <section className="toolPanel" aria-labelledby="app-title">
        <div className="headerBlock">
          <p className="eyebrow">日塗工 RGBマスター検索</p>
          <h1 id="app-title">調色スターター比率</h1>
        </div>

        <label className="inputLabel" htmlFor="color-code-input">日塗工番号</label>
        <div className="inputRow">
          <input
            id="color-code-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="22-75B"
            inputMode="text"
          />
          <button className="iconButton" type="button" onClick={handleReset} aria-label="入力をクリア">
            <RotateCcw size={20} aria-hidden="true" />
          </button>
        </div>

        <button className="primaryButton" type="button" onClick={handleSearch}>検索</button>
        {error && <p className="errorText">{error}</p>}

        {color && aiRatio && correctedRatio && (
          <section className="resultBlock" aria-label="検索結果">
            <div className="resultSummary">
              <div><span>code</span><strong>{color.code}</strong></div>
              <div><span>name</span><strong>{color.name || "-"}</strong></div>
              <div><span>RGB</span><strong>{color.r}, {color.g}, {color.b}</strong></div>
              <div><span>補正更新</span><strong>{savedCorrection?.updatedAt ? new Date(savedCorrection.updatedAt).toLocaleString("ja-JP") : "未保存"}</strong></div>
            </div>

            <table className="ratioTable">
              <thead>
                <tr>
                  <th>原色</th>
                  <th>AI比率</th>
                  <th>補正入力</th>
                  <th>補正済み</th>
                </tr>
              </thead>
              <tbody>
                {ratioRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td>
                      <div className="ratioCell">
                        <span>{aiRatio[row.key]}%</span>
                        <meter min="0" max="100" value={aiRatio[row.key]} />
                      </div>
                    </td>
                    <td>
                      <input
                        className="ratioInput"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={correctionForm[row.key]}
                        onChange={(event) => handleCorrectionChange(row.key, event.target.value)}
                        aria-label={`${row.label}の補正値`}
                      />
                    </td>
                    <td>
                      <div className="ratioCell compact">
                        <span>{correctedRatio[row.key]}%</span>
                        <meter min="0" max="100" value={correctedRatio[row.key]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>合計</td>
                  <td>{aiTotal}%</td>
                  <td>{ratioTotal(correctionForm)}%</td>
                  <td>{correctedTotal}%</td>
                </tr>
              </tfoot>
            </table>

            <label className="inputLabel memoLabel" htmlFor="correction-memo">職人メモ</label>
            <textarea
              id="correction-memo"
              value={memo}
              onChange={(event) => {
                setMemo(event.target.value);
                setSaveMessage("");
              }}
              placeholder="例: 現場では赤を少し抑える"
              rows={3}
            />

            <button className="primaryButton saveButton" type="button" onClick={handleSaveCorrection}>
              補正を保存
            </button>
            {saveMessage && <p className="saveText">{saveMessage}</p>}
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
