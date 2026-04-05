'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/constants/site';

const initialState = {
  name: '',
  companyName: '',
  country: '',
  email: '',
  productName: '',
  message: '',
};

export function InquiryForm({ locale, sourcePage }: { locale: Locale; sourcePage: string }) {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const t =
    locale === 'zh'
      ? {
          name: '姓名',
          email: '邮箱',
          company: '公司名称',
          country: '国家/地区',
          product: '产品名称',
          message: '需求说明',
          submit: '提交询价',
          submitting: '提交中...',
          success: '询价提交成功。',
          error: '提交失败，请稍后重试。',
        }
      : {
          name: 'Name',
          email: 'Email',
          company: 'Company',
          country: 'Country',
          product: 'Product',
          message: 'Message',
          submit: 'Submit Inquiry',
          submitting: 'Submitting...',
          success: 'Inquiry submitted successfully.',
          error: 'Submission failed. Please try again.',
        };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sourceLanguage: locale, sourcePage }),
      });

      if (!response.ok) throw new Error('Submit failed');
      setForm(initialState);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="card form-stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="name">{t.name}</label>
        <input id="name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
      </div>
      <div className="field">
        <label htmlFor="email">{t.email}</label>
        <input id="email" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
      </div>
      <div className="field">
        <label htmlFor="companyName">{t.company}</label>
        <input id="companyName" value={form.companyName} onChange={(e) => setForm((s) => ({ ...s, companyName: e.target.value }))} />
      </div>
      <div className="field">
        <label htmlFor="country">{t.country}</label>
        <input id="country" value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} />
      </div>
      <div className="field">
        <label htmlFor="productName">{t.product}</label>
        <input id="productName" value={form.productName} onChange={(e) => setForm((s) => ({ ...s, productName: e.target.value }))} />
      </div>
      <div className="field">
        <label htmlFor="message">{t.message}</label>
        <textarea id="message" rows={5} value={form.message} onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))} />
      </div>
      <button className="button button--primary" type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? t.submitting : t.submit}
      </button>
      {status === 'success' ? <p>{t.success}</p> : null}
      {status === 'error' ? <p>{t.error}</p> : null}
    </form>
  );
}
