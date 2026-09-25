"use client";

import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { initWeddingSite } from "@/lib/wedding-runtime";
import "react-toastify/dist/ReactToastify.css";

export default function WeddingRuntime() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    return initWeddingSite();
  }, []);

  if (!ready) return null;

  return (
    <ToastContainer
      position="bottom-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="light"
    />
  );
}
