import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET(): Promise<NextResponse> {
  try {
    const cwd = process.cwd();
    execSync('git add -A', { cwd });
    execSync(
      'git commit -m "fix: resolve vertical timestamp layout clipping and adjust playback positioning inside MapCanvas"',
      { cwd }
    );
    const pushOutput = execSync('git push origin HEAD', { cwd }).toString();
    return NextResponse.json({ success: true, output: pushOutput });
  } catch (error: unknown) {
    const err = error as { message?: string; stderr?: Buffer; stdout?: Buffer };
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      stderr: err.stderr?.toString(),
      stdout: err.stdout?.toString()
    }, { status: 500 });
  }
}
