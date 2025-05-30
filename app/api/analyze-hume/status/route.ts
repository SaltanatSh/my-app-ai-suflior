import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Не указан ID задачи' },
        { status: 400 }
      );
    }

    const humeApiKey = process.env.HUME_API_KEY;
    if (!humeApiKey) {
      console.error('HUME_API_KEY не установлен на сервере');
      return NextResponse.json(
        { error: 'API ключ Hume не настроен' },
        { status: 500 }
      );
    }

    const statusResponse = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`, {
      headers: {
        "X-Hume-Api-Key": humeApiKey,
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Ошибка при проверке статуса Hume:', statusResponse.status, errorText);
      return NextResponse.json(
        {
          error: `Ошибка при проверке статуса: ${statusResponse.statusText}`,
          details: errorText
        },
        { status: statusResponse.status }
      );
    }

    const result = await statusResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Внутренняя ошибка сервера при проверке статуса:', error);
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 