import arrayize from "../Util/arrayize";
import Spec, { ArgSpec, CommandOrSubcommandSpec, OptionSpec } from "./Spec";

interface ParsedArg {
  spec?: ArgSpec;
  values: string[];
  error?: string;
}

interface ParsedOption {
  spec?: OptionSpec;
  args: ParsedArg[];
  error?: string;
}

export interface ParsedCommandOrSubcommand {
  spec: CommandOrSubcommandSpec;
  name: string;
  args: ParsedArg[];
  options: {
    [key: string]: ParsedOption;
  };
  subcommand?: ParsedCommandOrSubcommand;
}

export default function parse(
  spec: Spec,
  tokens: string[],
): ParsedCommandOrSubcommand {
  let [command, ...restTokens] = tokens;
  let options: ParsedCommandOrSubcommand["options"] = {};
  let subcommand: ParsedCommandOrSubcommand["subcommand"] = undefined;

  interface ArgState {
    remainingSpecs: ArgSpec[];
    parsed: ParsedArg[];
    variadicValues: string[] | undefined;
  }
  let argState: ArgState = {
    remainingSpecs: arrayize(spec.args),
    parsed: [],
    variadicValues: undefined,
  };
  let optionState: ArgState | undefined = undefined;

  while (restTokens.length > 0) {
    let token = restTokens.shift()!;
    if (optionState && optionState.remainingSpecs.length === 0) {
      optionState = undefined;
    }
    let activeState = optionState ?? argState;

    // Dash-prefixed tokens are options only if we're not in the middle of
    // parsing an option. This is because options can have dash-prefixed args.
    // For example, `git commit -m -commit-message-with-dashes-`, is valid.
    if (optionState == null && token[0] === "-") {
      let optionSpec = arrayize(spec.options).find((option) => {
        return arrayize(option.name).includes(token);
      });
      console.log(arrayize(spec.options), optionSpec);

      if (optionSpec == null) {
        options[token] = {
          args: [],
          error: `ERROR: Invalid option ${token}`,
        };
        break;
      }

      optionState = {
        remainingSpecs: arrayize(optionSpec.args),
        parsed: [],
        variadicValues: undefined,
      };
      options[token] = {
        spec: optionSpec,
        args: optionState.parsed,
      };
    } else {
      let subcommandSpec =
        !optionState && argState.parsed.length === 0
          ? arrayize(spec.subcommands).find((subcommand) => {
              return arrayize(subcommand.name).includes(token);
            })
          : undefined;
      if (subcommandSpec == null) {
        if (activeState.variadicValues != null) {
          activeState.variadicValues.push(token);
        } else if (activeState.remainingSpecs.length > 0) {
          let spec = activeState.remainingSpecs.shift()!;
          let values = [token];
          let parsedArg: ParsedArg = {
            spec,
            values,
          };
          activeState.parsed.push(parsedArg);
          activeState.variadicValues = spec.isVariadic ? values : undefined;
        } else {
          activeState.parsed.push({
            values: [token],
            error: `ERROR: Invalid argument ${token}`,
          });
        }
      } else {
        subcommand = parse(subcommandSpec, [token, ...restTokens]);
        break;
      }
    }
  }

  return {
    spec: {
      ...spec,
      // Keep the output size manageable by removing unused properties. If we
      // parse subcommands, args, and options, we'll include their own specs in
      // their respected parsed fields.
      subcommands: undefined,
      args: undefined,
      options: undefined,
    },
    name: command,
    args: argState.parsed,
    options,
    subcommand,
  };
}
