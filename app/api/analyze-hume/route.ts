import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = formData.get('language') as string || 'ru-RU';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Аудиофайл не найден в FormData' },
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

    // Загрузка аудиофайла
    let publicAudioUrl = '';
    try {
      const filename = `recording-${Date.now()}.${audioFile.name.split('.').pop() || 'wav'}`;
      const blob = await put(filename, audioFile, {
        access: 'public',
        contentType: audioFile.type,
      });
      publicAudioUrl = blob.url;
    } catch (uploadError) {
      console.error('Ошибка загрузки аудио:', uploadError);
      return NextResponse.json(
        { 
          error: 'Ошибка загрузки аудиофайла',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Отправка запроса в Hume AI
    const humeRequestBody = {
      urls: [publicAudioUrl],
      models: {
        prosody: {
          // Анализ просодических характеристик речи
          identify_speakers: false,
          granularity: "utterance"
        },
        language: {
          // Анализ языковых характеристик
          granularity: "word",
          identify_speakers: false,
          sentiment: {}
        },
        burst: {
          // Анализ эмоциональных всплесков
          window_sizes: [3, 5]
        },
        transcription: {
          // Транскрипция речи
          language: language,
          identify_speakers: false
        }
      },
      notify: false
    };

    const humeApiResponse = await fetch("https://api.hume.ai/v0/batch/jobs", {
      method: "POST",
      headers: {
        "X-Hume-Api-Key": humeApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(humeRequestBody)
    });

    if (!humeApiResponse.ok) {
      const errorText = await humeApiResponse.text();
      console.error('Ошибка от Hume AI API:', humeApiResponse.status, errorText);
      return NextResponse.json(
        {
          error: `Ошибка от Hume API: ${humeApiResponse.statusText}`,
          details: errorText
        },
        { status: humeApiResponse.status }
      );
    }

    const jobSubmissionResult = await humeApiResponse.json();
    const jobId = jobSubmissionResult.job_id;

    if (!jobId) {
      console.error('Hume API не вернул job_id:', jobSubmissionResult);
      return NextResponse.json(
        { error: 'Hume API не вернул ID задачи' },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobId });

  } catch (error) {
    console.error('Внутренняя ошибка сервера:', error);
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 