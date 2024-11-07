import { NextRequest, NextResponse } from 'next/server';
import { uploadResume } from '@/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    const candidateId = parseInt(formData.get('candidateId') as string);

    if (!file || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read file as ArrayBuffer and convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload resume with correct MIME type
    const result = await uploadResume(
      candidateId,
      buffer,
      file.name,
      file.type || 'application/pdf'
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error handling resume upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
} 