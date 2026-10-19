import { useState, useEffect } from "react";

const pad = (n) => String(n).padStart(2, "0");

export const useCountdown = (endTime) => {
  const compute = () => {
    if (!endTime) return { timeLeft: "", isExpired: true, parts: null };
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { timeLeft: "00:00:00", isExpired: true, parts: { h:0, m:0, s:0 } };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { timeLeft: `${pad(h)}:${pad(m)}:${pad(s)}`, isExpired: false, parts: { h, m, s } };
  };

  const [state, setState] = useState(compute);

  useEffect(() => {
    if (!endTime) return;
    setState(compute());
    const id = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line
  }, [endTime]);

  return state;
};
