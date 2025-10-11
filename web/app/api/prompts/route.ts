// web/app/api/prompts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

// GET /api/prompts - List all prompts or search
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    const tags = searchParams.get('tags');

    let prompts;

    if (query) {
      prompts = store.searchPrompts(query);
    } else if (tags) {
      const tagArray = tags.split(',');
      prompts = store.getPromptsByTags(tagArray);
    } else {
      prompts = store.getAllPrompts();
    }

    return NextResponse.json({ prompts });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

// POST /api/prompts - Create new prompt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, body: promptBody, tags } = body;

    // Validation
    if (!title || !promptBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    const prompt = store.createPrompt({
      title,
      body: promptBody,
      tags: tags || [],
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
