import arrayize from "../Util/arrayize";
import Spec, { ArgSpec, CommandOrSubcommandSpec, OptionSpec } from "./Spec";

export interface ParsedCommandOrSubcommand {
  spec: CommandOrSubcommandSpec;
  name: string;
  args: string[];
  options: {
    [key: string]: {
      spec?: OptionSpec;
      args: string[];
      error?: string;
    };
  };
  subcommand?: ParsedCommandOrSubcommand;
}

export default function parse(
  spec: Spec,
  tokens: string[],
): ParsedCommandOrSubcommand {
  let [command, ...restTokens] = tokens;
  let args: ParsedCommandOrSubcommand["args"] = [];
  let options: ParsedCommandOrSubcommand["options"] = {};
  let subcommand: ParsedCommandOrSubcommand["subcommand"] = undefined;

  let optionState:
    | {
        remainingArgSpecs: ArgSpec[];
        parsedArgs: string[];
      }
    | undefined = undefined;

  while (restTokens.length > 0) {
    let token = restTokens.shift()!;
    if (optionState && optionState.remainingArgSpecs.length > 0) {
      optionState.remainingArgSpecs.shift();
      optionState.parsedArgs.push(token);
    } else if (token[0] === "-") {
      let optionSpec = arrayize(spec.options).find((option) => {
        return arrayize(option.name).includes(token);
      });
      if (optionSpec == null) {
        options[token] = {
          args: [],
          error: `ERROR: Invalid option ${token}`,
        };
        break;
      }

      optionState = {
        remainingArgSpecs: arrayize(optionSpec.args),
        parsedArgs: [],
      };
      options[token] = {
        spec: optionSpec,
        args: optionState.parsedArgs,
      };
    } else {
      let subcommandSpec =
        args.length === 0
          ? arrayize(spec.subcommands).find((subcommand) => {
              return arrayize(subcommand.name).includes(token);
            })
          : undefined;
      if (subcommandSpec == null) {
        args.push(token);
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
    args,
    options,
    subcommand,
  };
}
