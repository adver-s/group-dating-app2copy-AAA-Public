import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a readable stream for streaming the response
  const stream = new Readable({
    read() {}
  });

  // Function to send data to the client
  const sendData = (type: 'log' | 'complete' | 'error', message: string) => {
    const data = JSON.stringify({ type, message }) + '\n';
    stream.push(encoder.encode(data));
  };

  try {
    // Start the provisioning process
    sendData('log', '🚀 AWSインフラストラクチャプロビジョニングを開始...');
    
    const provisionProcess = spawn('npm', ['run', 'provision'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle stdout (success logs)
    provisionProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n').filter((line: string) => line.trim());
      
      lines.forEach((line: string) => {
        if (line.includes('✅') || line.includes('📋') || line.includes('📝')) {
          sendData('log', line);
        }
      });
    });

    // Handle stderr (error logs)
    provisionProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n').filter((line: string) => line.trim());
      
      lines.forEach((line: string) => {
        if (line.includes('❌') || line.includes('Error')) {
          sendData('log', line);
        }
      });
    });

    // Handle process completion
    provisionProcess.on('close', (code) => {
      if (code === 0) {
        sendData('complete', '✅ プロビジョニングが正常に完了しました！');
      } else {
        sendData('error', `❌ プロビジョニングが失敗しました（終了コード: ${code}）`);
      }
      stream.push(null); // End the stream
    });

    // Handle process errors
    provisionProcess.on('error', (error) => {
      sendData('error', `❌ プロセスエラー: ${error.message}`);
      stream.push(null);
    });

    // Set a timeout to prevent hanging
    setTimeout(() => {
      if (!provisionProcess.killed) {
        provisionProcess.kill('SIGTERM');
        sendData('error', '❌ プロビジョニングが5分でタイムアウトしました');
        stream.push(null);
      }
    }, 5 * 60 * 1000); // 5 minutes timeout

  } catch (error) {
    sendData('error', `❌ プロビジョニングの開始に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    stream.push(null);
  }

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 