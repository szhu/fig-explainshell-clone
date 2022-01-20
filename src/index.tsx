import { css } from "@emotion/css";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import parse, { ParsedCommandOrSubcommand } from "./Parser/parse";
import tokenize from "./Parser/tokenize";
import useSpec from "./Parser/useSpec";
import CommandComponent from "./Visual/CommandComponent";

const Pre = css`
  font-size: max(6px, 0.4em);
  white-space: pre-wrap;
`;

function App() {
  const [cmd, setCmd] = useState<string>("");
  let tokens = tokenize(cmd);
  const [spec, state] = useSpec(tokens[0]);
  let [parsed, setParsed] = useState<ParsedCommandOrSubcommand>();
  const [error, setError] = useState<string>();
  const [helpText, setHelpText] = useState<string | undefined>();

  if (state === "error") {
    parsed = undefined;
  }

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
        <div>
          <input
            type="text"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
          />
        </div>
        <br />
        <details>
          <summary>For example, click to try these commands.</summary>
          <ul
            className={css`
              max-height: max(3em, 80vh - 300px);
              overflow-y: auto;
            `}
          >
            {[
              //
              "mv -f file1 file2 dest",
              "git push origin main --force",
              "git reset --hard HEAD",
              "git diff --name-only --diff-filter=A --cached abc1234",
              "git way too many args",
              "brew install --cask some-app",
              "npm i -g npm@latest",
              `echo "I can use some \\"quotes\\" here, can't I?"`,
              "grep -E '\\(.*\\)' .",
              "mv newfile ~/Library/Application\\ Support",
              "rsync -rlptgoD -zvh backup.tar.gz /tmp/backups",
              "ls -lh",
              "ls -hl",
              `git commit -am "hello world"`,
              `git commit -vm "hello world"`,
              "defaults write com.apple.finder QuitMenuItem -bool yes",
            ].map((exampleCmd, i) => (
              <li
                key={i}
                onClick={(e) => setCmd(exampleCmd)}
                className={css`
                  cursor: pointer;
                `}
              >
                {exampleCmd}
              </li>
            ))}
          </ul>
        </details>
        <p>
          Note that some of these examples don't work because autocomplete data
          is incomplete, but they still parse as correctly as possible.
        </p>
      </fieldset>

      <fieldset>
        <legend>Output</legend>
        <div
          onMouseOver={(e) => {
            if (!(e.target instanceof HTMLElement)) return;

            let closest = e.target.closest("[data-help-name]");
            if (!(closest instanceof HTMLElement)) return;

            setHelpText(
              [closest.dataset.helpName, closest.dataset.helpDesc]
                .join("\n")
                .trim(),
            );
          }}
          onMouseLeave={() => {
            setHelpText(undefined);
          }}
        >
          <CommandComponent parsed={parsed} />
        </div>
        {parsed && <br />}
        <div
          className={css`
            line-height: 1.3em;
            opacity: ${parsed && helpText ? 1 : 0.3};
          `}
        >
          {parsed ? (
            helpText == null ? (
              <>Hover over the parts of the command to see what they mean.</>
            ) : (
              <>
                Explanation:{" "}
                {helpText ? (
                  helpText.split("\n").map((line, i) => <p key={i}>{line}</p>)
                ) : (
                  <>(No explanation provided.)</>
                )}
              </>
            )
          ) : (
            <>Type a command above to see it explained.</>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend>Debug</legend>

        <details>
          <summary>Tokenizing the input</summary>
          <pre className={Pre}>{JSON.stringify(tokens)}</pre>
        </details>
        <details>
          <summary>Loading the spec based on the first token: {state}</summary>
          <pre className={Pre}>
            {state === "done" ? JSON.stringify(spec, null, 2) : state}
          </pre>
        </details>
        <details>
          <summary>Parsing tokens into an AST</summary>
          <pre className={Pre}>{error}</pre>
          <pre className={Pre}>{JSON.stringify(parsed, null, 2)}</pre>
        </details>
      </fieldset>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
