"use client";

export default function GlobalError({
  error,
}: {
  error: Error;
}) {
  console.error("Global Error:", error);

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <p>Please try again later.</p>
      </body>
    </html>
  );
}