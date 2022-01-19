import { useEffect, useRef, useState } from "react";
import Spec from "./Spec";

const SpecCache: Record<string, Promise<any>> = {};

// Workaround to get Parcel to not follow import() references. Eventually there
// should be a way to do it without eval(), see:
// https://github.com/parcel-bundler/parcel/issues/4148
const nativeImport: (url: string) => any =
  // Using `window.eval` because using `eval` breaks the production build:
  //
  //     TypeError: $parcel$interopDefault is not a function or its return value is not iterable
  //
  window.eval(`url => import(url)`);

async function getSpec(cmd: string): Promise<Spec> {
  if (!SpecCache[cmd]) {
    const url = `https://cdn.skypack.dev/@withfig/autocomplete/build/${cmd}.js`;
    SpecCache[cmd] = nativeImport(url);
  }

  return (await SpecCache[cmd]).default;
}

export default function useSpec(cmd: string) {
  const cmdRef = useRef(cmd);
  cmdRef.current = cmd;
  const [spec, setSpec] = useState<Spec | null>(null);
  const [state, setState] = useState<"loading" | "done" | "error">("done");

  useEffect(() => {
    if (cmd) {
      setState("loading");
      getSpec(cmd)
        .then((spec) => {
          if (cmdRef.current !== cmd) return;
          setSpec(spec);
          setState("done");
        })
        .catch(() => {
          if (cmdRef.current !== cmd) return;
          setState("error");
        });
    } else {
      setSpec(null);
      setState("done");
    }
  }, [cmd]);

  return [spec, state] as const;
}
