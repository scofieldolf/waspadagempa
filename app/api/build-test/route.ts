import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function GET() {
  return new Promise((resolve) => {
    // Run the Next.js production build command
    exec(
      "npx next build",
      { cwd: process.cwd() },
      (error, stdout, stderr) => {
        resolve(
          NextResponse.json({
            success: !error,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            errorMessage: error ? error.message : null,
          })
        );
      }
    );
  });
}
