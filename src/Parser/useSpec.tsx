import { useEffect, useRef, useState } from "react";
import Spec from "./Spec";

const SpecCache: Record<string, Promise<any>> = {};

// https://github.com/parcel-bundler/parcel/issues/4148
const nativeImport: (url: string) => any = eval(`url => import(url)`);

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
