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
    specs: ArgSpec[];
    values: string[];
    getValueIndexToSpecIndex: (nValues: number) => number[];
    isVariadic: boolean;
    parsed: ParsedArg[];
    parse(): void;
  }

  function makeArgState(specs: ArgSpec[]): ArgState {
    /*
     * Example:
     * args:   fixedArg1 fixedArg2  |  variadicArgs ...     |  fixedArg3
     *         0         1          |  2                    |  3
     * values: input1    input2     |  input3       input4  |  input5
     *         0         1          |  2            3       |  4
     *        ----------------------+-----------------------+--------------
     *          section 1           |  section 2            |  section 3
     */

    // In the example, there are 2 fixed arg before the variadic arg.
    let nFixedBefore = specs.findIndex((spec) => spec.isVariadic);
    // In the example, there is 1 fixed arg after the variadic arg.
    let nFixedAfter = specs.length - nFixedBefore - 1;

    let isVariadic = nFixedBefore !== -1;

    // In the example, this should output: [0, 1, 2, 2, 3].
    function getValueIndexToSpecIndex(nValues: number) {
      let specIndices: number[] = [];

      let tooManyValues = false;

      let specIndex = 0;
      if (isVariadic) {
        // Section 1
        for (; specIndex < nFixedBefore; specIndex++) {
          specIndices.push(specIndex);
        }
      }
      // Section 2
      if (isVariadic) {
        let nVariadic = nValues - nFixedBefore - nFixedAfter;
        for (let i = 0; i < nVariadic; i++) {
          specIndices.push(specIndex);
        }
        specIndex++;
      }
      {
        // Section 3
        for (; specIndex < nValues; specIndex++) {
          if (specIndex >= specs.length) {
            tooManyValues = true;
            specIndices.push(specs.length);
          } else {
            specIndices.push(specIndex);
          }
        }
      }

      if (tooManyValues) {
        parsed.push({
          values: [],
          error: "Extra args, or invalid subcommand",
        });
      }

      return specIndices;
    }

    let parsed: ParsedArg[] = specs.map((spec) => ({
      spec,
      values: [],
    }));

    return {
      values: [],
      specs: specs,
      isVariadic,
      getValueIndexToSpecIndex,
      parsed,
      parse(this: ArgState) {
        let valueIndexToSpecIndex = this.getValueIndexToSpecIndex(
          this.values.length,
        );

        for (let i = 0; i < this.values.length; i++) {
          let value = this.values[i];
          let specIndex = valueIndexToSpecIndex[i];
          let parsed = this.parsed[specIndex];
          parsed.values.push(value);
        }
      },
    };
  }

  function valuesRemaining(state: ArgState): number {
    if (state.isVariadic) return Infinity;
    return state.specs.length - state.values.length;
  }

  let argState = makeArgState(arrayize(spec.args));
  let optionState: ArgState | undefined = undefined;

  while (restTokens.length > 0) {
    let token = restTokens.shift()!;
    if (optionState && valuesRemaining(optionState) === 0) {
      optionState.parse();
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

      if (optionSpec == null) {
        options[token] = {
          args: [],
          error: `Unknown option`,
        };
        break;
      }

      optionState = makeArgState(arrayize(optionSpec.args));
      options[token] = {
        spec: optionSpec,
        args: optionState.parsed,
      };
    } else {
      let subcommandSpec =
        !optionState && argState.values.length === 0
          ? arrayize(spec.subcommands).find((subcommand) => {
              return arrayize(subcommand.name).includes(token);
            })
          : undefined;

      if (subcommandSpec == null) {
        activeState.values.push(token);
      } else {
        subcommand = parse(subcommandSpec, [token, ...restTokens]);
        break;
      }
    }
  }

  if (optionState) {
    optionState.parse();
  }
  argState.parse();
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
