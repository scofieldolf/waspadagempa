import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function GET() {
  return new Promise((resolve) => {
    // Stage all changes, commit documentation, and push to GitHub remote
    exec(
      'git add . && git commit -m "docs: separate PRD specs and create premium README documentation" && git push',
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
