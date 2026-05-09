import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { findColorByCode, rgbToFivePrimaries } from "./nittoColorMaster.js";

const ratioRows = [
  { key: "white", label: "白" },
  { key: "black", label: "黒" },
  { key: "red", label: "赤" },
  { key: "yellow", label: "黄" },
  { key: "blue", label: "青" },
];

function App() {
  const [input, setInput] = useState("22-75B");
  const [color, setColor] = useState(null);
  const [ratio, setRatio] = useState(null);
  const [error, setError] = useState("");

  const total = useMemo(() => {
    if (!ratio) return 0;
    return Object.values(ratio).reduce((sum, value) => sum + value, 0);
  }, [ratio]);

  function handleSearch() {
    const foundColor = findColorByCode(input);
    if (!foundColor) {
      setColor(null);
      setRatio(null);
      setError("色番号が見つかりません");
      return;
    }
    setColor(foundColor);
    setRatio(rgbToFivePrimaries(foundColor.r, foundColor.g, foundColor.b));
    setError("");
  }

  function handleReset() {
    setInput("");
    setColor(null);
    setRatio(null);
    setError("");
  }

  return (
    <main className="appShell">
      <section className="toolPanel" aria-labelledby="app-title">
        <div className="headerBlock">
          <p className="eyebrow">日塗工 RGBマスタ検索</p>
          <h1 id="app-title">調色スタート比率</h1>
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

        {color && ratio && (
          <section className="resultBlock" aria-label="検索結果">
            <div className="resultSummary">
              <div><span>code</span><strong>{color.code}</strong></div>
              <div><span>name</span><strong>{color.name || "-"}</strong></div>
              <div><span>RGB</span><strong>{color.r}, {color.g}, {color.b}</strong></div>
              <div><span>合計</span><strong>{total}%</strong></div>
            </div>

            <table>
              <thead>
                <tr><th>原色</th><th>比率</th></tr>
              </thead>
              <tbody>
                {ratioRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td>
                      <div className="ratioCell">
                        <span>{ratio[row.key]}%</span>
                        <meter min="0" max="100" value={ratio[row.key]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
