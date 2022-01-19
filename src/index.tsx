import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import parse, { ParsedCommandOrSubcommand } from "./Parser/parse";
import tokenize from "./Parser/tokenize";
import useSpec from "./Parser/useSpec";
import CommandComponent from "./Visual/CommandComponent";

function App() {
  const [cmd, setCmd] = useState<string>("");
  let tokens = tokenize(cmd);
  const [spec, state] = useSpec(tokens[0]);
  const [parsed, setParsed] = useState<ParsedCommandOrSubcommand>();
  const [error, setError] = useState<string>();
  const [helpText, setHelpText] = useState<string | undefined>();

  useEffect(() => {
    if (spec) {
      let newParsed;
      try {
        newParsed = parse(spec, tokens);
        setError(undefined);
      } catch (e) {
        console.trace(e);
        setError(e.message);
      }
      setParsed(newParsed);
    }
  }, [cmd, spec]);

  return (
    <div>
      <fieldset>
        <legend>Input</legend>
        Explain this shell command to me:
        <br />
        <input
          type="text"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
        />
      </fieldset>

      <fieldset>
        <legend>Output</legend>
        <div
          onMouseOver={(e) => {
            if (!(e.target instanceof HTMLElement)) return;

            let closest = e.target.closest("[data-help]");
            if (!(closest instanceof HTMLElement)) return;

            setHelpText(closest.dataset.help);
          }}
        >
          <CommandComponent parsed={parsed} />
        </div>
        {parsed && <br />}
        <div>
          {parsed ? (
            helpText ? (
              <>Explanation: {helpText}</>
            ) : (
              <>Hover over the parts of the command for help.</>
            )
          ) : (
            <>Type a command avove to see it explained.</>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend>Debug</legend>
        <details>
          <summary>Tokenizing the input</summary>
          <pre>{JSON.stringify(tokens)}</pre>
        </details>
        <details>
          <summary>Loading the spec based on the first token: {state}</summary>
          <pre>{state === "done" ? JSON.stringify(spec, null, 2) : state}</pre>
        </details>
        <details>
          <summary>Parsing tokens into an AST</summary>
          <pre>{error}</pre>
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </details>
      </fieldset>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
