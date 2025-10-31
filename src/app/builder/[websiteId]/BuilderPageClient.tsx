'use client';

import { useEffect, useState } from 'react';
import NewBuilderShell from '@/components/NewBuilderShell';
import NewBuilderPreview from '@/components/NewBuilderPreview';
import NewInspectorPanel from '@/components/NewInspectorPanel';

export default function BuilderPageClient({ websiteId }: { websiteId: string }) {
  const [templateHtml, setTemplateHtml] = useState('');
  const [data, setData] = useState({
    title: 'My Awesome Website',
    business: 'Prosite Inc.',
    logo: '',
  });

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const res = await fetch(`/api/templates/${websiteId}`);
        if (!res.ok) throw new Error('Failed to load template');
        const template = await res.json();
        setTemplateHtml(template.html || '');
      } catch (err) {
        console.error('Template fetch failed:', err);
      }
    }
    fetchTemplate();
  }, [websiteId]);

  return (
    <NewBuilderShell>
      <main className="main">
        <NewBuilderPreview templateHtml={templateHtml} data={data} />
      </main>
      <aside className="inspector">
        <NewInspectorPanel data={data} setData={setData} />
      </aside>
    </NewBuilderShell>
  );
}
