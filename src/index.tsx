import { css } from "@emotion/css";
import ReactDOM from "react-dom";

function App() {
  return (
    <h1
      className={css`
        color: blue;
      `}
    >
      Hello world!
    </h1>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
