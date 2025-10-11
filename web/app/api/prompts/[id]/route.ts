import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

// GET /api/prompts/:id - Get single prompt
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prompt = store.getPrompt(params.id);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

// PUT /api/prompts/:id - Update prompt
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, body: promptBody, tags } = body;

    const updated = store.updatePrompt(params.id, {
      title,
      body: promptBody,
      tags,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prompt: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/:id - Delete prompt
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = store.deletePrompt(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
