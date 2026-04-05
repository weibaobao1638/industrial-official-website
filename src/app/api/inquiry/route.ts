import { NextResponse } from 'next/server';
import { directusCreateItem } from '@/lib/directus/client';
import type { InquiryPayload } from '@/types/inquiry';

export async function POST(request: Request) {
  const body = (await request.json()) as InquiryPayload;

  if (!body.name || !body.email) {
    return NextResponse.json({ message: 'Name and email are required.' }, { status: 400 });
  }

  try {
    const created = await directusCreateItem<
      {
        name: string;
        company_name?: string;
        country?: string;
        email: string;
        phone?: string;
        whatsapp?: string;
        product_name?: string;
        quantity?: string;
        spec_requirements?: string;
        message?: string;
        source_page?: string;
        source_language?: string;
        status: string;
      },
      { id: string | number }
    >({
      path: '/items/inquiries',
      body: {
        name: body.name,
        company_name: body.companyName,
        country: body.country,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        product_name: body.productName,
        quantity: body.quantity,
        spec_requirements: body.specRequirements,
        message: body.message,
        source_page: body.sourcePage,
        source_language: body.sourceLanguage,
        status: 'new',
      },
    });

    return NextResponse.json({ ok: true, stored: Boolean(created), id: created?.id ?? null });
  } catch (error) {
    console.error('Inquiry submission failed', error);
    return NextResponse.json({ message: 'Inquiry submission failed.' }, { status: 500 });
  }
}
