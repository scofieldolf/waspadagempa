import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET(): Promise<NextResponse> {
  try {
    const cwd = process.cwd();
    
    // Stage all modified files
    execSync('git add -A', { cwd });
    
    // Commit with feature message
    execSync(
      'git commit -m "feat: implement live USGS data integration with auto-refresh and live status indicator"',
      { cwd }
    );
    
    // Push to origin
    const pushOutput = execSync('git push origin HEAD', { cwd }).toString();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Committed and pushed successfully',
      output: pushOutput
    });
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
