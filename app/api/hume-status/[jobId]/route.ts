import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;
  const humeApiKey = process.env.HUME_API_KEY;

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID не предоставлен' }, { status: 400 });
  }
  if (!humeApiKey) {
    return NextResponse.json({ error: 'API ключ Hume не настроен' }, { status: 500 });
  }

  try {
    const humeResponse = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'X-Hume-Api-Key': humeApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!humeResponse.ok) {
      const errorText = await humeResponse.text();
      return NextResponse.json(
        {
          error: `Ошибка от Hume API при получении статуса: ${humeResponse.statusText}`,
          details: errorText
        },
        { status: humeResponse.status }
      );
    }

    const data = await humeResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return NextResponse.json(
      {
        error: 'Ошибка при запросе статуса задачи Hume',
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 