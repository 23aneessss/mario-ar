'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, LoaderCircle } from 'lucide-react';
import type { Asset } from '@/data/catalog';
import { modelThumbnail } from '@/lib/model-thumbnails';
export function ModelThumbnail({ asset }: { asset: Asset }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      setLoading(true);
      modelThumbnail(asset).then(preview => { if (active) setUrl(preview); })
        .catch(() => { if (active) setFailed(true); })
        .finally(() => { if (active) setLoading(false); });
    });
    if (ref.current) observer.observe(ref.current);
    return () => { active = false; observer.disconnect(); };
  }, [asset]);
  return <span ref={ref} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    {url ? <img src={url} alt="" style={{ objectFit: 'contain' }} /> : loading && !failed ? <LoaderCircle size={22} className="spin" /> : <Box size={36} strokeWidth={1} />}
  </span>;
}
