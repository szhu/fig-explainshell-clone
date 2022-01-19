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

  let currentOptionArgsSpecs: ArgSpec[] = [];
  let currentOptionArgs: string[] | undefined = undefined;

  while (restTokens.length > 0) {
    let token = restTokens.shift();
    if (currentOptionArgsSpecs.length > 0) {
      currentOptionArgsSpecs.shift();
      currentOptionArgs.push(token);
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

      currentOptionArgsSpecs = arrayize(optionSpec.args);
      currentOptionArgs = [];
      options[token] = {
        spec: optionSpec,
        args: currentOptionArgs,
      };
    } else {
      let subcommandSpec = undefined;
      if (args.length === 0) {
        subcommandSpec = arrayize(spec.subcommands).find((subcommand) => {
          return arrayize(subcommand.name).includes(token);
        });
      }
      if (subcommandSpec == null) {
        args.push(token);
      } else {
        subcommand = parse(subcommandSpec, [token, ...restTokens]);
        break;
      }
    }
  }

  return {
    spec,
    name: command,
    args,
    options,
    subcommand,
  };
}
