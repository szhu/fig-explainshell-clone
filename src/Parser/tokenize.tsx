const Quotes = ['"', "'"];

export default function tokenize(input: string): string[] {
  // The top of the stack will be at the front of the array, just to make it
  // easier to peek at the top -- `tokens[0]` vs `tokens[tokens.length - 1]`.
  let tokens: string[] = [];
  let bracketStack: string[] = [];
  let currentToken: string = "";

  for (let i = 0; i < input.length; i++) {
    let cur = input[i];

    if (bracketStack.length === 0 && cur === " ") {
      if (currentToken.length > 0) {
        tokens.push(currentToken);
      }
      currentToken = "";
    } else if (bracketStack.length === 0 && Quotes.includes(cur)) {
      bracketStack.unshift(cur);
    } else if (Quotes.includes(cur) && cur === bracketStack[0]) {
      bracketStack.shift();
    } else if (cur === "\\" && bracketStack[0] !== "'") {
      currentToken += input[++i] ?? "";
    } else {
      currentToken += cur;
    }
  }

  if (currentToken.length > 0) {
    tokens.push(currentToken);
  }
  return tokens;
}
