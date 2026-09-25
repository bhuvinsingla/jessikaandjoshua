import fs from "fs";
import path from "path";
import WeddingRuntime from "@/components/WeddingRuntime";

export const dynamic = "force-static";

const markup = fs.readFileSync(
  path.join(process.cwd(), "public", "wedding-body.html"),
  "utf8"
);

  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <WeddingRuntime />
    </>
  );
}
