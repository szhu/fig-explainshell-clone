import { css } from "@emotion/css";
import React from "react";
import { ParsedCommandOrSubcommand } from "../Parser/parse";

const Row = css`
  display: flex;
  align-items: center;
  gap: 1ch;
  padding: 1px 5px;
  margin: 0 -6px;
`;

const Highlight = css`
  border: 1px solid transparent;

  &:hover {
    border-color: black;
    background: var(--color-highlight);
  }
`;

const SubcommandComponent: React.FC<{
  parsed: ParsedCommandOrSubcommand | undefined;
}> = (props) => {
  if (!props.parsed) return null;

  return (
    <div
      className={css`
        ${Row}
        ${Highlight}
      `}
    >
      <div data-help={props.parsed.spec.description}>{props.parsed.name}</div>
      {Object.entries(props.parsed.options).map(([flag, option]) => {
        return (
          <div
            key={flag}
            className={css`
              ${Row}
              ${Highlight}
            `}
            data-help={option.spec?.description}
          >
            <div>{flag}</div>
            {option.error && <div>{option.error}</div>}
            {option.args.map(
              (arg, i) =>
                arg.values.length > 0 && (
                  <div
                    key={i}
                    className={css`
                      ${Row}
                      ${Highlight}
                    `}
                    data-help={arg.spec?.name}
                  >
                    {arg.values.map((value, j) => (
                      <div key={j}>{value}</div>
                    ))}
                  </div>
                ),
            )}
          </div>
        );
      })}
      {props.parsed.args.map(
        (arg, i) =>
          arg.values.length > 0 && (
            <div
              key={i}
              className={css`
                ${Row}
                ${Highlight}
              `}
              data-help={arg.spec?.name}
            >
              {arg.values.map((value, j) => (
                <div key={j}>{value}</div>
              ))}
            </div>
          ),
      )}
      <SubcommandComponent parsed={props.parsed.subcommand} />
    </div>
  );
};

const CommandComponent: React.FC<{
  parsed: ParsedCommandOrSubcommand | undefined;
}> = (props) => {
  if (!props.parsed) return null;

  return (
    <div
      className={css`
        ${Row}
      `}
    >
      <SubcommandComponent {...props} />
    </div>
  );
};

export default CommandComponent;
