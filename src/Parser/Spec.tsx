export interface CommandOrSubcommandSpec {
  name: string | string[];
  description?: string;
  args?: ArgSpec | ArgSpec[];
  insertValue?: string;
  options?: OptionSpec[];
  subcommands?: CommandOrSubcommandSpec[];
  additionalSuggestions?: AdditionalSuggestionsSpec[];
}

export interface ArgSpec {
  name?: string;
  description?: string;
  default?: string;
  suggestions?: string[] | RichSuggestionSpec[];
  parserDirectives?: {};
  template?: TemplateSpec | TemplateSpec[];
  isVariadic?: boolean;
  isCommand?: boolean;
  isOptional?: boolean;
  generators?: GeneratorSpec | GeneratorSpec[];
}

interface GeneratorSpec {
  script?: string;
  template?: TemplateSpec | TemplateSpec[];
}

type TemplateSpec = "filepaths" | "folders";

interface RichSuggestionSpec {
  name: string | string[];
  icon?: string;
  description?: string;
  insertValue?: string;
}

export interface OptionSpec {
  name: string | string[];
  isDangerous?: boolean;
  isRepeatable?: boolean | number;
  args?: ArgSpec | ArgSpec[];
  description?: string;
  dependsOn?: string[];
  exclusiveOn?: string[];
  requiresEquals?: boolean;
  insertValue?: string;
}

interface AdditionalSuggestionsSpec {
  name: string;
  description: string;
  insertValue: string;
  icon: string;
}

export default interface Spec extends CommandOrSubcommandSpec {}
