import { useState, useRef } from "react";

export default function CodePlayground({ code = "", language = "javascript" }) {
  const [source, setSource] = useState(code);
  const [output, setOutput] = useState("");
  const textareaRef = useRef(null);

  function run() {
    setOutput("");
    const logs = [];
    const fakeConsole = {
      log: (...args) => logs.push(args.map(String).join(" ")),
      error: (...args) => logs.push("Error: " + args.map(String).join(" ")),
      warn: (...args) => logs.push("Warn: " + args.map(String).join(" ")),
    };

    try {
      const fn = new Function("console", source);
      fn(fakeConsole);
      setOutput(logs.join("\n") || "(no output)");
    } catch (err) {
      setOutput("Error: " + err.message);
    }
  }

  return (
    <div className="not-prose border border-white my-6">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white">
        <span className="text-xs uppercase opacity-60">
          {language}
        </span>
        <button
          onClick={run}
          className="px-3 py-1 text-xs font-medium uppercase border border-white bg-white text-black hover:bg-black hover:text-white transition-colors duration-100"
        >
          Run
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        className="block w-full bg-black text-white text-sm font-mono p-4 resize-y min-h-24 focus:outline-none"
        rows={source.split("\n").length + 1}
      />
      {output && (
        <div className="border-t border-white p-4">
          <pre className="text-sm font-mono opacity-60 whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
